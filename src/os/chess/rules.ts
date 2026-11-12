import { Chess } from "chess.js";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const LEVELS = ["easy", "medium", "hard", "master"] as const;
export type BotLevel = (typeof LEVELS)[number];
export type Side = "w" | "b";
export type Result = "white" | "black" | "draw";

export const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
export const parseUci = (u: string) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }) as { from: never; to: never; promotion?: string };

export type Outcome = { over: boolean; result: Result | null; reason: string | null };

/** Game-over state of a position, as the rules define it. */
export function outcome(c: Chess): Outcome {
  if (c.isCheckmate()) return { over: true, result: c.turn() === "w" ? "black" : "white", reason: "checkmate" };
  if (c.isStalemate()) return { over: true, result: "draw", reason: "stalemate" };
  if (c.isInsufficientMaterial()) return { over: true, result: "draw", reason: "insufficient" };
  if (c.isThreefoldRepetition()) return { over: true, result: "draw", reason: "repetition" };
  if (c.isDraw()) return { over: true, result: "draw", reason: "fifty-move" };
  return { over: false, result: null, reason: null };
}

/** Replays a list of UCI moves from the starting position. Returns null if any move is illegal. */
export function replay(moves: string[], fen = START_FEN): Chess | null {
  const c = new Chess(fen);
  for (const u of moves) {
    if (!UCI.test(u)) return null;
    try {
      c.move(parseUci(u));
    } catch {
      return null;
    }
  }
  return c;
}

/* ───────── points ───────── */
export const BOT_BASE: Record<BotLevel, number> = { easy: 10, medium: 25, hard: 60, master: 120 };

/** Points for a finished game against the bot: a win pays more the harder the level and the faster the mate. */
export function botPoints(level: BotLevel, result: "win" | "loss" | "draw", fullMoves: number): number {
  const base = BOT_BASE[level];
  if (result === "loss") return 0;
  if (result === "draw") return Math.floor(base * 0.3);
  const speed = Math.max(0, 45 - fullMoves) / 90; // up to +50% for a quick win
  return Math.round(base * (1 + speed));
}

/** Elo for online games. `score` is 1 win, 0.5 draw, 0 loss from the first player's side. */
export function elo(ra: number, rb: number, score: number, k = 32): [number, number] {
  const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400));
  const delta = Math.round(k * (score - ea));
  return [ra + delta, rb - delta];
}

/** Points for an online result, with a bonus for beating a stronger player. */
export function onlinePoints(result: "win" | "loss" | "draw", myRating: number, oppRating: number): number {
  if (result === "loss") return 0;
  if (result === "draw") return 20;
  return 50 + Math.max(0, Math.min(40, Math.round((oppRating - myRating) / 5)));
}

export const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/;
export function sanitizeNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const n = raw.normalize("NFKC").replace(/[^\p{L}\p{N} _.-]/gu, "").replace(/\s+/g, " ").trim();
  return n.length >= 2 && n.length <= 20 ? n : null;
}
