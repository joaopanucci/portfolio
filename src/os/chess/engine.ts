import { Chess, type Move, type Square } from "chess.js";

export type Level = "easy" | "medium" | "hard";
export type EngineMove = { from: Square; to: Square; promotion?: string };

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables (white's point of view, a8 → h1), after the "simplified evaluation function".
const PST: Record<string, number[]> = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

/** Static evaluation in centipawns from the side-to-move's point of view. */
function evaluate(game: Chess): number {
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const idx = p.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const v = VALUE[p.type] + PST[p.type][idx];
      score += p.color === "w" ? v : -v;
    }
  return game.turn() === "w" ? score : -score;
}

const MATE = 100000;

function order(moves: Move[]) {
  return moves
    .map((m) => ({ m, s: (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] : 0) + (m.promotion ? 800 : 0) + (m.san.includes("+") ? 50 : 0) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}

function search(game: Chess, depth: number, alpha: number, beta: number, ply: number, deadline: number, state: { nodes: number; stop: boolean }): number {
  if (state.stop) return 0;
  if ((++state.nodes & 255) === 0 && Date.now() > deadline) {
    state.stop = true;
    return 0;
  }
  if (game.isCheckmate()) return -MATE + ply;
  if (game.isDraw()) return 0;
  if (depth === 0) return evaluate(game);
  let best = -Infinity;
  for (const m of order(game.moves({ verbose: true }))) {
    game.move(m);
    const score = -search(game, depth - 1, -beta, -alpha, ply + 1, deadline, state);
    game.undo();
    if (state.stop) return 0;
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Picks a move for the side to play. Weaker levels search less and sometimes pick a near-best alternative. */
export function bestMove(fen: string, level: Level): EngineMove | null {
  const game = new Chess(fen);
  const moves = order(game.moves({ verbose: true }));
  if (!moves.length) return null;
  const maxDepth = level === "easy" ? 1 : level === "medium" ? 2 : 5;
  const budget = level === "easy" ? 300 : level === "medium" ? 900 : 2200;
  const deadline = Date.now() + budget;
  let scored = moves.map((m) => ({ m, score: 0 }));
  for (let depth = 1; depth <= maxDepth; depth++) {
    const state = { nodes: 0, stop: false };
    const round = scored.map(({ m }) => {
      game.move(m);
      const score = -search(game, depth - 1, -Infinity, Infinity, 1, deadline, state);
      game.undo();
      return { m, score };
    });
    if (state.stop) break; // keep the last fully searched depth
    scored = round.sort((a, b) => b.score - a.score);
    if (scored[0].score > MATE - 100) break;
  }
  let pick = scored[0];
  if (level === "easy") {
    const pool = scored.slice(0, Math.min(5, scored.length));
    pick = pool[Math.floor(Math.random() * pool.length)];
  } else if (level === "medium" && scored.length > 1 && Math.random() < 0.25) {
    pick = scored[1];
  }
  return { from: pick.m.from, to: pick.m.to, promotion: pick.m.promotion };
}
