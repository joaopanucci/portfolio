import { Chess } from "chess.js";
import * as svc from "../src/os/chess/service";
import { botPoints, elo } from "../src/os/chess/rules";
import { perft, think } from "../src/os/chess/fast";

class Mem implements svc.Store {
  players = new Map<string, svc.Player>();
  games: svc.GameRow[] = [];
  bot: { player_id: string; at: number }[] = [];
  seq = 0;
  tick = 0;
  async getPlayer(id: string) { return this.players.get(id) ?? null; }
  async upsertPlayer(id: string, nickname: string) { const p = this.players.get(id) ?? { id, nickname, points: 0, rating: 1000, games: 0, wins: 0, losses: 0, draws: 0 }; p.nickname = nickname; this.players.set(id, p); return p; }
  async patchPlayer(id: string, patch: Partial<svc.Player>) { Object.assign(this.players.get(id)!, patch); }
  async insertBotGame(row: { player_id: string }) { this.bot.push({ player_id: row.player_id, at: Date.now() }); }
  async lastBotGameAt(id: string) { const l = this.bot.filter((b) => b.player_id === id).at(-1); return l ? l.at : null; }
  async getGameByCode(code: string) { return this.games.find((g) => g.code === code) ?? null; }
  async insertGame(r: Pick<svc.GameRow, "code" | "white_id" | "black_id" | "status" | "fen" | "turn">) {
    if (this.games.some((g) => g.code === r.code)) return null;
    const row: svc.GameRow = { ...r, id: "g" + ++this.seq, moves: [], result: null, reason: null, draw_offer: null, created_at: new Date().toISOString(), updated_at: new Date(Date.now() + ++this.tick).toISOString() };
    this.games.push(row); return row;
  }
  async updateGame(id: string, patch: Partial<svc.GameRow>, expect: string) {
    const g = this.games.find((x) => x.id === id)!; if (g.updated_at !== expect) return null;
    Object.assign(g, patch); g.updated_at = new Date(Date.now() + ++this.tick).toISOString(); return { ...g };
  }
}
let failures = 0;
// ───────── engine: move generator against known perft counts ─────────
const cases: [string, string, number[]][] = [
  ["start", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [20, 400, 8902, 197281]],
  ["kiwipete", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", [48, 2039, 97862]],
  ["pos3", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", [14, 191, 2812, 43238]],
  ["pos4", "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", [6, 264, 9467]],
  ["pos5", "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", [44, 1486, 62379]],
  ["pos6", "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10", [46, 2079, 89890]],
];

function check(name: string, cond: boolean, extra = "") { if (!cond) failures++; console.log(cond ? "ok  " : "FAIL", name, extra); }

const expectErr = async (name: string, fn: () => Promise<unknown>, status: number, msg: string) => {
  try { await fn(); check(name, false, "no error"); } catch (e) { const a = e as svc.ApiError; check(name, a.status === status && a.message === msg, `${a.status} ${a.message}`); }
};

for (const [name, fen, expected] of cases) expected.forEach((e, i) => check(`perft ${name} d${i + 1}`, perft(fen, i + 1) === e));
for (const [name, fen, want] of [["scholar mate in 1", "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "h5f7"], ["back rank mate", "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1", "a1a8"]]) {
  const m = think(fen, "hard").move;
  check(`engine finds ${name}`, !!m && m.from + m.to === want);
}

const s = new Mem();
await expectErr("profile bad nickname", () => svc.saveProfile(s, "A", "x"), 400, "nickname-invalid");
await svc.saveProfile(s, "A", "  Alice  "); await svc.saveProfile(s, "B", "Bob");
check("nickname trimmed", s.players.get("A")!.nickname === "Alice");
await expectErr("create needs profile", () => svc.createGame(s, "Z", "w"), 400, "profile-required");

// ---- online game: fool's mate ----
const g = await svc.createGame(s, "A", "w");
check("created waiting", g.status === "waiting" && g.white_id === "A" && /^[A-Z2-9]{6}$/.test(g.code), g.code);
await expectErr("bad code", () => svc.joinGame(s, "B", "abc"), 400, "code-invalid");
await expectErr("unknown code", () => svc.joinGame(s, "B", "AAAAAA"), 404, "game-not-found");
const j = await svc.joinGame(s, "B", g.code.toLowerCase());
check("joined active", j.status === "active" && j.black_id === "B");
await svc.saveProfile(s, "C", "Carol");
await expectErr("third player", () => svc.joinGame(s, "C", g.code), 409, "game-full");
await expectErr("black cannot move first", () => svc.playMove(s, "B", g.code, "e7e5"), 409, "not-your-turn");
await expectErr("illegal move", () => svc.playMove(s, "A", g.code, "e2e5"), 400, "move-illegal");
await expectErr("stranger", () => svc.playMove(s, "C", g.code, "e2e4"), 403, "not-a-player");
for (const [u, m] of [["A", "f2f3"], ["B", "e7e5"], ["A", "g2g4"], ["B", "d8h4"]] as const) await svc.playMove(s, u, g.code, m);
const done = (await s.getGameByCode(g.code))!;
check("checkmate recorded", done.status === "finished" && done.result === "black" && done.reason === "checkmate");
check("ratings updated", s.players.get("B")!.rating > 1000 && s.players.get("A")!.rating < 1000, `${s.players.get("A")!.rating}/${s.players.get("B")!.rating}`);
check("points: winner paid", s.players.get("B")!.points >= 50 && s.players.get("A")!.points === 0, `${s.players.get("B")!.points}`);
await expectErr("no move after end", () => svc.playMove(s, "A", g.code, "a2a3"), 409, "game-not-active");

// ---- draw offer / resign / timeout ----
const g2 = await svc.createGame(s, "A", "b"); await svc.joinGame(s, "B", g2.code);
check("A is black", (await s.getGameByCode(g2.code))!.black_id === "A");
await svc.playMove(s, "B", g2.code, "e2e4");
await svc.gameAction(s, "A", g2.code, "offer_draw");
await expectErr("cannot accept own offer", () => svc.gameAction(s, "A", g2.code, "accept_draw"), 409, "no-offer");
const dd = await svc.gameAction(s, "B", g2.code, "accept_draw");
check("draw by agreement", dd.result === "draw" && dd.status === "finished");
const g3 = await svc.createGame(s, "A", "w"); await svc.joinGame(s, "B", g3.code);
await expectErr("timeout too early", () => svc.gameAction(s, "A", g3.code, "claim_timeout"), 409, "too-early"); // A's own turn
await svc.playMove(s, "A", g3.code, "e2e4");
await expectErr("timeout too early 2", () => svc.gameAction(s, "A", g3.code, "claim_timeout", Date.now()), 409, "too-early");
const to = await svc.gameAction(s, "A", g3.code, "claim_timeout", Date.now() + 6 * 60_000);
check("timeout win", to.result === "white" && to.reason === "timeout");
const g4 = await svc.createGame(s, "A", "w"); await svc.joinGame(s, "B", g4.code);
const rs = await svc.gameAction(s, "A", g4.code, "resign");
check("resign", rs.result === "black" && rs.reason === "resign");
const g5 = await svc.createGame(s, "A", "random");
const cx = await svc.gameAction(s, "A", g5.code, "cancel");
check("cancel waiting", cx.status === "finished" && cx.reason === "cancelled");

// ---- bot games ----
const fool = ["f2f3", "e7e5", "g2g4", "d8h4"]; // black mates in 2: too short to count as a win
await expectErr("unfinished bot game", () => svc.submitBotGame(s, "A", { level: "easy", color: "w", moves: ["e2e4"] }), 400, "game-unfinished");
await expectErr("illegal bot game", () => svc.submitBotGame(s, "A", { level: "easy", color: "w", moves: ["e2e5"] }), 400, "moves-illegal");
await expectErr("bad level", () => svc.submitBotGame(s, "A", { level: "god", color: "w", moves: fool }), 400, "level-invalid");
await expectErr("win too short", () => svc.submitBotGame(s, "A", { level: "hard", color: "b", moves: fool }), 400, "too-short");
const longWin = ["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"]; // scholar mate, 7 plies... white wins at ply 7
await expectErr("win still too short", () => svc.submitBotGame(s, "A", { level: "hard", color: "w", moves: longWin }), 400, "too-short");
const loss = await svc.submitBotGame(s, "A", { level: "hard", color: "w", moves: fool }, Date.now() + 1);
check("loss pays nothing", loss.result === "loss" && loss.points === 0);
await expectErr("rate limit", () => svc.submitBotGame(s, "A", { level: "easy", color: "w", moves: ["f2f3","e7e5","g2g4","d8h4"] }, Date.now()), 429, "too-fast");
const resigned = await svc.submitBotGame(s, "A", { level: "medium", color: "w", moves: ["e2e4"], resigned: true }, Date.now() + 20_000);
check("resign counts as loss", resigned.result === "loss");

// fastest legal "win" for a stronger length: construct mate in 8 moves via known game (Légal's mate)
const legal = ["e2e4","e7e5","g1f3","d7d6","f1c4","c8g4","b1c3","g7g6","f3e5","g4d1","c4f7","e8e7","c3d5"]; // Légal's mate
const lc = new Chess(); for (const u of legal) lc.move({ from: u.slice(0,2), to: u.slice(2,4) } as never);
check("legal mate position is checkmate", lc.isCheckmate());
const win = await svc.submitBotGame(s, "A", { level: "master", color: "w", moves: legal }, Date.now() + 60_000);
check("bot win pays (master, fast)", win.result === "win" && win.points >= 120, `${win.points}`);
check("points math", botPoints("easy", "win", 45) === 10 && botPoints("hard", "draw", 30) === 18 && botPoints("medium", "loss", 10) === 0);
check("elo symmetric", elo(1000, 1000, 1)[0] === 1016 && elo(1000, 1000, 1)[1] === 984);
console.log(failures ? `${failures} FAILED` : "ALL CHESS TESTS OK");
process.exit(failures ? 1 : 0);
