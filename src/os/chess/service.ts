import { Chess } from "chess.js";
import { ALPHABET, BOT_BASE, CODE_RE, LEVELS, START_FEN, UCI, botPoints, elo, onlinePoints, outcome, parseUci, replay, sanitizeNickname, type BotLevel, type Result, type Side } from "./rules";

export type Player = { id: string; nickname: string; points: number; rating: number; games: number; wins: number; losses: number; draws: number };
export type GameRow = {
  id: string;
  code: string;
  white_id: string | null;
  black_id: string | null;
  status: "waiting" | "active" | "finished";
  fen: string;
  moves: string[];
  turn: Side;
  result: Result | null;
  reason: string | null;
  draw_offer: Side | null;
  created_at: string;
  updated_at: string;
};

/** Persistence used by the game service. Implemented on Supabase in production and in memory in tests. */
export interface Store {
  getPlayer(id: string): Promise<Player | null>;
  upsertPlayer(id: string, nickname: string): Promise<Player>;
  patchPlayer(id: string, patch: Partial<Omit<Player, "id">>): Promise<void>;
  insertBotGame(row: { player_id: string; level: BotLevel; player_color: Side; result: string; moves: string[]; points: number }): Promise<void>;
  lastBotGameAt(playerId: string): Promise<number | null>;
  getGameByCode(code: string): Promise<GameRow | null>;
  insertGame(row: Pick<GameRow, "code" | "white_id" | "black_id" | "status" | "fen" | "turn">): Promise<GameRow | null>;
  /** Updates only if `updated_at` still matches (optimistic concurrency). Returns null on a lost race. */
  updateGame(id: string, patch: Partial<GameRow>, expectUpdatedAt: string): Promise<GameRow | null>;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const fail = (status: number, message: string): never => {
  throw new ApiError(status, message);
};

const mySide = (g: GameRow, uid: string): Side | null => (g.white_id === uid ? "w" : g.black_id === uid ? "b" : null);

export async function saveProfile(store: Store, uid: string, nickname: unknown) {
  const n = sanitizeNickname(nickname);
  if (!n) return fail(400, "nickname-invalid");
  return store.upsertPlayer(uid, n);
}

export async function submitBotGame(store: Store, uid: string, body: { level?: unknown; color?: unknown; moves?: unknown; resigned?: unknown }, now = Date.now()) {
  const player = await store.getPlayer(uid);
  if (!player) return fail(400, "profile-required");
  const level = body.level as BotLevel;
  if (!LEVELS.includes(level)) return fail(400, "level-invalid");
  const color = body.color;
  if (color !== "w" && color !== "b") return fail(400, "color-invalid");
  const moves = body.moves;
  if (!Array.isArray(moves) || moves.length > 600 || !moves.every((m) => typeof m === "string" && UCI.test(m))) return fail(400, "moves-invalid");
  const c = replay(moves);
  if (!c) return fail(400, "moves-illegal");
  const out = outcome(c);
  const resigned = body.resigned === true;
  if (!out.over && !resigned) return fail(400, "game-unfinished");
  const last = await store.lastBotGameAt(uid);
  if (last && now - last < 8000) return fail(429, "too-fast");

  let result: "win" | "loss" | "draw";
  if (out.over) result = out.result === "draw" ? "draw" : (out.result === "white") === (color === "w") ? "win" : "loss";
  else result = "loss";
  const fullMoves = Math.ceil(moves.length / 2);
  if (result === "win" && moves.length < 8) return fail(400, "too-short");
  const points = botPoints(level, result, fullMoves);
  await store.insertBotGame({ player_id: uid, level, player_color: color, result, moves, points });
  const next: Player = {
    ...player,
    points: player.points + points,
    games: player.games + 1,
    wins: player.wins + (result === "win" ? 1 : 0),
    losses: player.losses + (result === "loss" ? 1 : 0),
    draws: player.draws + (result === "draw" ? 1 : 0),
  };
  await store.patchPlayer(uid, { points: next.points, games: next.games, wins: next.wins, losses: next.losses, draws: next.draws });
  return { result, points, player: next, base: BOT_BASE[level] };
}

const randomCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export async function createGame(store: Store, uid: string, color: unknown) {
  if (!(await store.getPlayer(uid))) return fail(400, "profile-required");
  const side: Side = color === "w" || color === "b" ? color : Math.random() < 0.5 ? "w" : "b";
  for (let i = 0; i < 6; i++) {
    const row = await store.insertGame({
      code: randomCode(),
      white_id: side === "w" ? uid : null,
      black_id: side === "b" ? uid : null,
      status: "waiting",
      fen: START_FEN,
      turn: "w",
    });
    if (row) return row;
  }
  return fail(500, "code-unavailable");
}

export async function joinGame(store: Store, uid: string, code: unknown) {
  if (typeof code !== "string" || !CODE_RE.test(code.toUpperCase())) return fail(400, "code-invalid");
  if (!(await store.getPlayer(uid))) return fail(400, "profile-required");
  const g = await store.getGameByCode(code.toUpperCase());
  if (!g) return fail(404, "game-not-found");
  if (mySide(g, uid)) return g; // rejoining your own game
  if (g.status !== "waiting") return fail(409, "game-full");
  const patch: Partial<GameRow> = g.white_id ? { black_id: uid, status: "active" } : { white_id: uid, status: "active" };
  const row = await store.updateGame(g.id, patch, g.updated_at);
  return row ?? fail(409, "game-full");
}

async function settle(store: Store, g: GameRow) {
  if (!g.white_id || !g.black_id || !g.result) return;
  const [w, b] = await Promise.all([store.getPlayer(g.white_id), store.getPlayer(g.black_id)]);
  if (!w || !b) return;
  const score = g.result === "white" ? 1 : g.result === "black" ? 0 : 0.5;
  const [rw, rb] = elo(w.rating, b.rating, score);
  const res = (side: Side) => (g.result === "draw" ? "draw" : (g.result === "white") === (side === "w") ? "win" : "loss");
  const apply = async (p: Player, side: Side, rating: number, opp: number) => {
    const r = res(side);
    await store.patchPlayer(p.id, {
      rating,
      points: p.points + onlinePoints(r, p.rating, opp),
      games: p.games + 1,
      wins: p.wins + (r === "win" ? 1 : 0),
      losses: p.losses + (r === "loss" ? 1 : 0),
      draws: p.draws + (r === "draw" ? 1 : 0),
    });
  };
  await apply(w, "w", rw, b.rating);
  await apply(b, "b", rb, w.rating);
}

export async function playMove(store: Store, uid: string, code: unknown, uci: unknown) {
  if (typeof code !== "string" || typeof uci !== "string" || !UCI.test(uci)) return fail(400, "move-invalid");
  const g = await store.getGameByCode(code.toUpperCase());
  if (!g) return fail(404, "game-not-found");
  const side = mySide(g, uid);
  if (!side) return fail(403, "not-a-player");
  if (g.status !== "active") return fail(409, "game-not-active");
  if (g.turn !== side) return fail(409, "not-your-turn");
  const c = new Chess(g.fen);
  try {
    c.move(parseUci(uci));
  } catch {
    return fail(400, "move-illegal");
  }
  const out = outcome(c);
  const patch: Partial<GameRow> = { fen: c.fen(), moves: [...g.moves, uci], turn: c.turn(), draw_offer: null };
  if (out.over) Object.assign(patch, { status: "finished", result: out.result, reason: out.reason });
  const row = await store.updateGame(g.id, patch, g.updated_at);
  if (!row) return fail(409, "conflict");
  if (out.over) await settle(store, row);
  return row;
}

export async function gameAction(store: Store, uid: string, code: unknown, action: unknown, now = Date.now()) {
  if (typeof code !== "string") return fail(400, "code-invalid");
  const g = await store.getGameByCode(code.toUpperCase());
  if (!g) return fail(404, "game-not-found");
  const side = mySide(g, uid);
  if (!side) return fail(403, "not-a-player");
  if (g.status === "waiting" && action === "cancel") {
    const row = await store.updateGame(g.id, { status: "finished", result: null, reason: "cancelled" }, g.updated_at);
    return row ?? fail(409, "conflict");
  }
  if (g.status !== "active") return fail(409, "game-not-active");
  const other: Side = side === "w" ? "b" : "w";
  const win = (s: Side): Result => (s === "w" ? "white" : "black");
  let patch: Partial<GameRow>;
  switch (action) {
    case "resign":
      patch = { status: "finished", result: win(other), reason: "resign" };
      break;
    case "offer_draw":
      patch = { draw_offer: side };
      break;
    case "decline_draw":
      patch = { draw_offer: null };
      break;
    case "accept_draw":
      if (g.draw_offer !== other) return fail(409, "no-offer");
      patch = { status: "finished", result: "draw", reason: "agreement", draw_offer: null };
      break;
    case "claim_timeout":
      if (g.turn !== other || now - Date.parse(g.updated_at) < 5 * 60_000) return fail(409, "too-early");
      patch = { status: "finished", result: win(side), reason: "timeout" };
      break;
    default:
      return fail(400, "action-invalid");
  }
  const row = await store.updateGame(g.id, patch, g.updated_at);
  if (!row) return fail(409, "conflict");
  if (row.status === "finished") await settle(store, row);
  return row;
}
