/**
 * A compact chess engine on a 0x88 board: legal move generation, incremental Zobrist hashing,
 * iterative-deepening alpha-beta (PVS) with a transposition table, null-move pruning, late-move
 * reductions, killer/history ordering and quiescence search. Self-contained, so it can also be
 * run by the API routes and checked against chess.js with perft.
 */
export type Level = "easy" | "medium" | "hard" | "master";
export type EngineMove = { from: string; to: string; promotion?: string };

const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
const VAL = [0, 100, 320, 330, 500, 900, 0];
const MATE = 30000;

const KNIGHT = [-33, -31, -18, -14, 14, 18, 31, 33];
const KINGD = [-17, -16, -15, -1, 1, 15, 16, 17];
const DIAG = [-17, -15, 15, 17];
const ORTH = [-16, -1, 1, 16];

// move = from | to << 7 | promo << 14 | flags << 17 (1 capture, 2 en passant, 4 castle, 8 double push)
const F_CAP = 1, F_EP = 2, F_CASTLE = 4, F_DOUBLE = 8;

const CASTLE_KEEP = new Int8Array(128).fill(15);
CASTLE_KEEP[0] = 13;
CASTLE_KEEP[4] = 12;
CASTLE_KEEP[7] = 14;
CASTLE_KEEP[112] = 7;
CASTLE_KEEP[116] = 3;
CASTLE_KEEP[119] = 11;

// piece-square tables, white's point of view, a8 → h1
const PST: number[][] = [
  [],
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
];
const KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];

/* ───────── zobrist ───────── */
let seed = 0x9e3779b9;
const rnd = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return seed | 0;
};
const ZLO = new Int32Array(16 * 128), ZHI = new Int32Array(16 * 128);
for (let i = 0; i < ZLO.length; i++) {
  ZLO[i] = rnd();
  ZHI[i] = rnd();
}
const ZSIDE_LO = rnd(), ZSIDE_HI = rnd();
const ZCAS_LO = Array.from({ length: 16 }, rnd), ZCAS_HI = Array.from({ length: 16 }, rnd);
const ZEP_LO = Array.from({ length: 8 }, rnd), ZEP_HI = Array.from({ length: 8 }, rnd);

/* ───────── position ───────── */
const board = new Int8Array(128);
let side = 0; // 0 white, 8 black
let castle = 0;
let ep = -1;
let half = 0;
const king = [0, 0];
let hLo = 0, hHi = 0;
let ply = 0; // plies made since the position was loaded

const MAXSTACK = 1024;
const stM = new Int32Array(MAXSTACK), stCap = new Int8Array(MAXSTACK), stCastle = new Int8Array(MAXSTACK), stEp = new Int16Array(MAXSTACK);
const stHalf = new Int16Array(MAXSTACK), stLo = new Int32Array(MAXSTACK), stHi = new Int32Array(MAXSTACK);

const PIECE_CHARS = "pnbrqk";
export function load(fen: string) {
  board.fill(0);
  const [placement, turn, rights, enPassant, halfmove] = fen.trim().split(/\s+/);
  let r = 7, f = 0;
  for (const ch of placement) {
    if (ch === "/") {
      r--;
      f = 0;
    } else if (ch >= "1" && ch <= "8") f += +ch;
    else {
      const lower = ch.toLowerCase();
      const t = PIECE_CHARS.indexOf(lower) + 1;
      const color = ch === lower ? 8 : 0;
      const sq = r * 16 + f;
      board[sq] = t | color;
      if (t === K) king[color >> 3] = sq;
      f++;
    }
  }
  side = turn === "b" ? 8 : 0;
  castle = 0;
  if (rights && rights !== "-") {
    if (rights.includes("K")) castle |= 1;
    if (rights.includes("Q")) castle |= 2;
    if (rights.includes("k")) castle |= 4;
    if (rights.includes("q")) castle |= 8;
  }
  ep = enPassant && enPassant !== "-" ? (+enPassant[1] - 1) * 16 + (enPassant.charCodeAt(0) - 97) : -1;
  half = halfmove ? +halfmove || 0 : 0;
  ply = 0;
  hLo = hHi = 0;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;
    const p = board[sq];
    if (p) {
      hLo ^= ZLO[p * 128 + sq];
      hHi ^= ZHI[p * 128 + sq];
    }
  }
  if (side) {
    hLo ^= ZSIDE_LO;
    hHi ^= ZSIDE_HI;
  }
  hLo ^= ZCAS_LO[castle];
  hHi ^= ZCAS_HI[castle];
  if (ep >= 0) {
    hLo ^= ZEP_LO[ep & 7];
    hHi ^= ZEP_HI[ep & 7];
  }
}

function attacked(sq: number, by: number): boolean {
  // pawns
  if (by === 0) {
    let s = sq - 15;
    if (!(s & 0x88) && board[s] === P) return true;
    s = sq - 17;
    if (!(s & 0x88) && board[s] === P) return true;
  } else {
    let s = sq + 15;
    if (!(s & 0x88) && board[s] === (P | 8)) return true;
    s = sq + 17;
    if (!(s & 0x88) && board[s] === (P | 8)) return true;
  }
  const n = N | by, k = K | by;
  for (let i = 0; i < 8; i++) {
    let s = sq + KNIGHT[i];
    if (!(s & 0x88) && board[s] === n) return true;
    s = sq + KINGD[i];
    if (!(s & 0x88) && board[s] === k) return true;
  }
  const b = B | by, r = R | by, q = Q | by;
  for (let i = 0; i < 4; i++) {
    let s = sq + DIAG[i];
    while (!(s & 0x88)) {
      const p = board[s];
      if (p) {
        if (p === b || p === q) return true;
        break;
      }
      s += DIAG[i];
    }
    s = sq + ORTH[i];
    while (!(s & 0x88)) {
      const p = board[s];
      if (p) {
        if (p === r || p === q) return true;
        break;
      }
      s += ORTH[i];
    }
  }
  return false;
}

/* ───────── move generation ───────── */
const MOVES = new Int32Array(256 * 128);
const SCORES = new Int32Array(256 * 128);

function gen(base: number, capturesOnly: boolean): number {
  let n = base;
  const us = side, them = us ^ 8;
  const dir = us === 0 ? 16 : -16;
  const startRank = us === 0 ? 1 : 6;
  const promoRank = us === 0 ? 6 : 1;
  const add = (from: number, to: number, promo: number, flags: number) => {
    MOVES[n++] = from | (to << 7) | (promo << 14) | (flags << 17);
  };
  for (let from = 0; from < 128; from++) {
    if (from & 0x88) {
      from += 7;
      continue;
    }
    const piece = board[from];
    if (!piece || (piece & 8) !== us) continue;
    const t = piece & 7;
    if (t === P) {
      const rank = from >> 4;
      const one = from + dir;
      if (!capturesOnly || rank === promoRank) {
        if (!(one & 0x88) && !board[one]) {
          if (rank === promoRank) for (let pr = Q; pr >= N; pr--) add(from, one, pr, 0);
          else {
            add(from, one, 0, 0);
            if (rank === startRank && !board[one + dir]) add(from, one + dir, 0, F_DOUBLE);
          }
        }
      }
      for (let d = -1; d <= 1; d += 2) {
        const to = from + dir + d;
        if (to & 0x88) continue;
        const target = board[to];
        if (target && (target & 8) === them) {
          if (rank === promoRank) for (let pr = Q; pr >= N; pr--) add(from, to, pr, F_CAP);
          else add(from, to, 0, F_CAP);
        } else if (!target && to === ep) add(from, to, 0, F_CAP | F_EP);
      }
    } else if (t === N || t === K) {
      const offs = t === N ? KNIGHT : KINGD;
      for (let i = 0; i < 8; i++) {
        const to = from + offs[i];
        if (to & 0x88) continue;
        const target = board[to];
        if (!target) {
          if (!capturesOnly) add(from, to, 0, 0);
        } else if ((target & 8) === them) add(from, to, 0, F_CAP);
      }
      if (t === K && !capturesOnly) {
        if (us === 0 && from === 4) {
          if (castle & 1 && !board[5] && !board[6] && board[7] === R && !attacked(4, 8) && !attacked(5, 8)) add(4, 6, 0, F_CASTLE);
          if (castle & 2 && !board[3] && !board[2] && !board[1] && board[0] === R && !attacked(4, 8) && !attacked(3, 8)) add(4, 2, 0, F_CASTLE);
        } else if (us === 8 && from === 116) {
          if (castle & 4 && !board[117] && !board[118] && board[119] === (R | 8) && !attacked(116, 0) && !attacked(117, 0)) add(116, 118, 0, F_CASTLE);
          if (castle & 8 && !board[115] && !board[114] && !board[113] && board[112] === (R | 8) && !attacked(116, 0) && !attacked(115, 0)) add(116, 114, 0, F_CASTLE);
        }
      }
    } else {
      const slide = (dirs: number[]) => {
        for (let i = 0; i < 4; i++) {
          let to = from + dirs[i];
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              if (!capturesOnly) add(from, to, 0, 0);
            } else {
              if ((target & 8) === them) add(from, to, 0, F_CAP);
              break;
            }
            to += dirs[i];
          }
        }
      };
      if (t === B || t === Q) slide(DIAG);
      if (t === R || t === Q) slide(ORTH);
    }
  }
  return n;
}

/* ───────── make / undo ───────── */
function make(m: number) {
  const from = m & 127, to = (m >> 7) & 127, promo = (m >> 14) & 7, fl = m >> 17;
  const us = side;
  stM[ply] = m;
  stCastle[ply] = castle;
  stEp[ply] = ep;
  stHalf[ply] = half;
  stLo[ply] = hLo;
  stHi[ply] = hHi;
  hLo ^= ZCAS_LO[castle];
  hHi ^= ZCAS_HI[castle];
  if (ep >= 0) {
    hLo ^= ZEP_LO[ep & 7];
    hHi ^= ZEP_HI[ep & 7];
  }
  const piece = board[from];
  let cap = board[to];
  if (fl & F_EP) {
    const capSq = to - (us === 0 ? 16 : -16);
    cap = board[capSq];
    board[capSq] = 0;
    hLo ^= ZLO[cap * 128 + capSq];
    hHi ^= ZHI[cap * 128 + capSq];
  } else if (cap) {
    hLo ^= ZLO[cap * 128 + to];
    hHi ^= ZHI[cap * 128 + to];
  }
  stCap[ply] = cap;
  board[from] = 0;
  hLo ^= ZLO[piece * 128 + from];
  hHi ^= ZHI[piece * 128 + from];
  const placed = promo ? promo | us : piece;
  board[to] = placed;
  hLo ^= ZLO[placed * 128 + to];
  hHi ^= ZHI[placed * 128 + to];
  if (fl & F_CASTLE) {
    const rf = to > from ? to + 1 : to - 2;
    const rt = to > from ? to - 1 : to + 1;
    const rook = board[rf];
    board[rf] = 0;
    board[rt] = rook;
    hLo ^= ZLO[rook * 128 + rf] ^ ZLO[rook * 128 + rt];
    hHi ^= ZHI[rook * 128 + rf] ^ ZHI[rook * 128 + rt];
  }
  if ((piece & 7) === K) king[us >> 3] = to;
  castle &= CASTLE_KEEP[from] & CASTLE_KEEP[to];
  ep = fl & F_DOUBLE ? from + (us === 0 ? 16 : -16) : -1;
  half = (piece & 7) === P || cap ? 0 : half + 1;
  side ^= 8;
  hLo ^= ZSIDE_LO ^ ZCAS_LO[castle];
  hHi ^= ZSIDE_HI ^ ZCAS_HI[castle];
  if (ep >= 0) {
    hLo ^= ZEP_LO[ep & 7];
    hHi ^= ZEP_HI[ep & 7];
  }
  ply++;
}

function undo() {
  ply--;
  side ^= 8;
  const us = side;
  const m = stM[ply];
  const from = m & 127, to = (m >> 7) & 127, promo = (m >> 14) & 7, fl = m >> 17;
  const cap = stCap[ply];
  const piece = promo ? P | us : board[to];
  board[from] = piece;
  board[to] = 0;
  if (fl & F_EP) board[to - (us === 0 ? 16 : -16)] = cap;
  else board[to] = cap;
  if (fl & F_CASTLE) {
    const rf = to > from ? to + 1 : to - 2;
    const rt = to > from ? to - 1 : to + 1;
    board[rf] = board[rt];
    board[rt] = 0;
  }
  if ((piece & 7) === K) king[us >> 3] = from;
  castle = stCastle[ply];
  ep = stEp[ply];
  half = stHalf[ply];
  hLo = stLo[ply];
  hHi = stHi[ply];
}

function makeNull() {
  stM[ply] = 0;
  stEp[ply] = ep;
  stHalf[ply] = half;
  stLo[ply] = hLo;
  stHi[ply] = hHi;
  if (ep >= 0) {
    hLo ^= ZEP_LO[ep & 7];
    hHi ^= ZEP_HI[ep & 7];
  }
  ep = -1;
  side ^= 8;
  hLo ^= ZSIDE_LO;
  hHi ^= ZSIDE_HI;
  half++;
  ply++;
}
function undoNull() {
  ply--;
  side ^= 8;
  ep = stEp[ply];
  half = stHalf[ply];
  hLo = stLo[ply];
  hHi = stHi[ply];
}

const inCheck = () => attacked(king[side >> 3], (side ^ 8) as number);

/** Legal moves only: plays each pseudo-legal move and rejects the ones that leave the king attacked. */
export function perft(fen: string, depth: number): number {
  load(fen);
  const run = (d: number, base: number): number => {
    if (d === 0) return 1;
    const n = gen(base, false);
    let total = 0;
    for (let i = base; i < n; i++) {
      const us = side;
      make(MOVES[i]);
      if (!attacked(king[us >> 3], side)) total += run(d - 1, n);
      undo();
    }
    return total;
  };
  return run(depth, 0);
}

/* ───────── evaluation ───────── */
function evaluate(): number {
  let score = 0;
  let material = 0;
  let bishopsW = 0, bishopsB = 0;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = board[sq];
    if (!p) continue;
    const t = p & 7;
    if (t !== P && t !== K) material += VAL[t];
    if (t === B) {
      if (p & 8) bishopsB++;
      else bishopsW++;
    }
  }
  const endgame = material <= 2600;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = board[sq];
    if (!p) continue;
    const t = p & 7;
    const white = !(p & 8);
    const f = sq & 7, r = sq >> 4;
    const idx = white ? (7 - r) * 8 + f : r * 8 + f;
    const table = t === K && endgame ? KING_END : PST[t];
    const v = VAL[t] + table[idx];
    score += white ? v : -v;
  }
  if (bishopsW >= 2) score += 30;
  if (bishopsB >= 2) score -= 30;
  return (side === 0 ? score : -score) + 8;
}

/* ───────── search ───────── */
const TT_BITS = 20;
const TT_SIZE = 1 << TT_BITS;
const ttHi = new Int32Array(TT_SIZE), ttScore = new Int32Array(TT_SIZE), ttMove = new Int32Array(TT_SIZE), ttMeta = new Int16Array(TT_SIZE);
const killers = new Int32Array(64 * 2);
const history = new Int32Array(2 * 128 * 128);
let nodes = 0;
let deadline = 0;
let stopped = false;

function quiesce(alpha: number, beta: number, d: number): number {
  if ((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
  if (stopped) return 0;
  const stand = evaluate();
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  if (d <= -8) return alpha;
  const base = (ply + 1) * 256 > MOVES.length - 256 ? 0 : (ply + 1) * 256;
  const n = gen(base, true);
  for (let i = base; i < n; i++) {
    const m = MOVES[i];
    const victim = board[(m >> 7) & 127] & 7;
    SCORES[i] = (m >> 17) & F_EP ? 100 : victim * 10 * 100 - (board[m & 127] & 7) * 10 + ((m >> 14) & 7 ? 900 : 0);
  }
  for (let i = base; i < n; i++) {
    let best = i;
    for (let j = i + 1; j < n; j++) if (SCORES[j] > SCORES[best]) best = j;
    if (best !== i) {
      const tm = MOVES[i], ts = SCORES[i];
      MOVES[i] = MOVES[best];
      SCORES[i] = SCORES[best];
      MOVES[best] = tm;
      SCORES[best] = ts;
    }
    const us = side;
    make(MOVES[i]);
    if (attacked(king[us >> 3], side)) {
      undo();
      continue;
    }
    const score = -quiesce(-beta, -alpha, d - 1);
    undo();
    if (stopped) return 0;
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function isRepetition(): boolean {
  const limit = Math.max(0, ply - half);
  for (let i = ply - 2; i >= limit; i -= 2) if (stLo[i] === hLo && stHi[i] === hHi) return true;
  return false;
}

function hasPieces(color: number): boolean {
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = board[sq];
    if (p && (p & 8) === color && (p & 7) > P && (p & 7) < K) return true;
  }
  return false;
}

function negamax(depth: number, alpha: number, beta: number, allowNull: boolean): number {
  if ((++nodes & 1023) === 0 && Date.now() > deadline) stopped = true;
  if (stopped) return 0;
  const root = ply === rootPly;
  if (!root && (half >= 100 || isRepetition())) return 0;
  const checked = inCheck();
  if (checked && ply - rootPly < 60) depth++;
  if (depth <= 0) return quiesce(alpha, beta, 0);
  const sp = ply - rootPly;
  const alpha0 = alpha;

  const slot = hLo & (TT_SIZE - 1);
  let hashMove = 0;
  if (ttHi[slot] === hHi) {
    hashMove = ttMove[slot];
    const meta = ttMeta[slot];
    const td = meta >> 2, flag = meta & 3;
    if (td >= depth && !root) {
      let s = ttScore[slot];
      if (s > MATE - 200) s -= sp;
      else if (s < -MATE + 200) s += sp;
      if (flag === 0) return s;
      if (flag === 1 && s >= beta) return s;
      if (flag === 2 && s <= alpha) return s;
    }
  }

  if (allowNull && !checked && depth >= 3 && hasPieces(side) && beta < MATE - 200) {
    makeNull();
    const s = -negamax(depth - 3, -beta, -beta + 1, false);
    undoNull();
    if (stopped) return 0;
    if (s >= beta) return beta;
  }

  const base = ply * 256 > MOVES.length - 256 ? 0 : ply * 256;
  const n = gen(base, false);
  const k0 = killers[sp * 2], k1 = killers[sp * 2 + 1];
  const sideIdx = side >> 3;
  for (let i = base; i < n; i++) {
    const m = MOVES[i];
    let s = 0;
    if (m === hashMove) s = 1_000_000;
    else if ((m >> 17) & F_CAP) s = 100_000 + (board[(m >> 7) & 127] & 7) * 100 - (board[m & 127] & 7) * 10 + ((m >> 17) & F_EP ? 100 : 0);
    else if ((m >> 14) & 7) s = 90_000 + ((m >> 14) & 7);
    else if (m === k0) s = 80_000;
    else if (m === k1) s = 70_000;
    else s = history[sideIdx * 16384 + (m & 127) * 128 + ((m >> 7) & 127)];
    SCORES[i] = s;
  }

  let best = -Infinity;
  let bestMove = 0;
  let legal = 0;
  for (let i = base; i < n; i++) {
    let pick = i;
    for (let j = i + 1; j < n; j++) if (SCORES[j] > SCORES[pick]) pick = j;
    if (pick !== i) {
      const tm = MOVES[i], ts = SCORES[i];
      MOVES[i] = MOVES[pick];
      SCORES[i] = SCORES[pick];
      MOVES[pick] = tm;
      SCORES[pick] = ts;
    }
    const m = MOVES[i];
    const us = side;
    make(m);
    if (attacked(king[us >> 3], side)) {
      undo();
      continue;
    }
    legal++;
    const quiet = !((m >> 17) & F_CAP) && !((m >> 14) & 7);
    let score: number;
    if (legal === 1) score = -negamax(depth - 1, -beta, -alpha, true);
    else {
      let red = 0;
      if (depth >= 3 && legal > 4 && quiet && !checked) red = legal > 8 ? 2 : 1;
      score = -negamax(depth - 1 - red, -alpha - 1, -alpha, true);
      if (score > alpha && red) score = -negamax(depth - 1, -alpha - 1, -alpha, true);
      if (score > alpha && score < beta) score = -negamax(depth - 1, -beta, -alpha, true);
    }
    undo();
    if (stopped) return 0;
    if (score > best) {
      best = score;
      bestMove = m;
      if (root) {
        rootBest = m;
        rootScore = score;
      }
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      if (quiet) {
        if (killers[sp * 2] !== m) {
          killers[sp * 2 + 1] = killers[sp * 2];
          killers[sp * 2] = m;
        }
        history[sideIdx * 16384 + (m & 127) * 128 + ((m >> 7) & 127)] += depth * depth;
      }
      break;
    }
  }
  if (!legal) return checked ? -MATE + sp : 0;

  let flag = 0;
  if (best <= alpha0) flag = 2;
  else if (best >= beta) flag = 1;
  let store = best;
  if (store > MATE - 200) store += sp;
  else if (store < -MATE + 200) store -= sp;
  ttHi[slot] = hHi;
  ttScore[slot] = store;
  ttMove[slot] = bestMove;
  ttMeta[slot] = (Math.min(depth, 60) << 2) | flag;
  return best;
}

let rootPly = 0;
let rootBest = 0;
let rootScore = 0;

const sqName = (sq: number) => String.fromCharCode(97 + (sq & 7)) + ((sq >> 4) + 1);
const toMove = (m: number): EngineMove => {
  const promo = (m >> 14) & 7;
  return { from: sqName(m & 127), to: sqName((m >> 7) & 127), ...(promo ? { promotion: PIECE_CHARS[promo - 1] } : {}) };
};

function legalRootMoves(): number[] {
  const n = gen(0, false);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const us = side;
    make(MOVES[i]);
    if (!attacked(king[us >> 3], side)) out.push(MOVES[i]);
    undo();
  }
  return out;
}

const PLAN: Record<Level, { depth: number; ms: number }> = {
  easy: { depth: 2, ms: 250 },
  medium: { depth: 4, ms: 700 },
  hard: { depth: 8, ms: 1800 },
  master: { depth: 16, ms: 4800 },
};

export type Analysis = { move: EngineMove | null; score: number; depth: number; nodes: number };

/** Chooses a move for the side to play. Easy plays a noisy shallow move; the rest search deeper with more time. */
export function think(fen: string, level: Level): Analysis {
  load(fen);
  const legal = legalRootMoves();
  if (!legal.length) return { move: null, score: 0, depth: 0, nodes: 0 };
  if (legal.length === 1) return { move: toMove(legal[0]), score: 0, depth: 0, nodes: 0 };
  killers.fill(0);
  history.fill(0);
  nodes = 0;
  stopped = false;
  rootPly = ply;

  if (level === "easy") {
    // score every move with a shallow search, add noise, play one of the best-looking ones
    deadline = Date.now() + PLAN.easy.ms;
    const scored = legal.map((m) => {
      make(m);
      const s = -negamax(1, -MATE, MATE, false) + (Math.random() - 0.5) * 220;
      undo();
      return { m, s };
    });
    scored.sort((a, b) => b.s - a.s);
    if (scored[0].s > MATE - 100) return { move: toMove(scored[0].m), score: scored[0].s, depth: 2, nodes };
    const pool = scored.slice(0, Math.min(3, scored.length));
    return { move: toMove(pool[Math.floor(Math.random() * pool.length)].m), score: scored[0].s, depth: 2, nodes };
  }

  const { depth: maxDepth, ms } = PLAN[level];
  deadline = Date.now() + ms;
  let bestMove = legal[0];
  let bestScore = 0;
  let reached = 0;
  for (let d = 1; d <= maxDepth; d++) {
    rootBest = 0;
    const s = negamax(d, -MATE - 1, MATE + 1, false);
    if (stopped) {
      // a partially searched iteration is still useful when it already improved on a root move
      if (rootBest && d > 1) {
        bestMove = rootBest;
        bestScore = rootScore;
      }
      break;
    }
    bestMove = rootBest || bestMove;
    bestScore = s;
    reached = d;
    if (Math.abs(s) > MATE - 100) break;
  }
  return { move: toMove(bestMove), score: bestScore, depth: reached, nodes };
}

export function bestMoveFast(fen: string, level: Level): EngineMove | null {
  return think(fen, level).move;
}
