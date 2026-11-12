"use client";
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { Words } from "../../i18n";

export const GLYPH: Record<PieceSymbol, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
export const FILES = "abcdefgh";

export type Snap = {
  board: ReturnType<Chess["board"]>;
  history: Move[];
  turn: Color;
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  over: boolean;
};

export const snapshot = (g: Chess): Snap => ({
  board: g.board(),
  history: g.history({ verbose: true }),
  turn: g.turn(),
  check: g.isCheck(),
  checkmate: g.isCheckmate(),
  stalemate: g.isStalemate(),
  over: g.isGameOver(),
});

export const toUci = (m: Pick<Move, "from" | "to" | "promotion">) => m.from + m.to + (m.promotion ?? "");

export type Pending = { from: Square; to: Square };

/** Translates an API error code into the user's language. */
export function errorText(t: Words, code: string): string {
  const key = `err_${code.replace(/-/g, "_")}`;
  return (t as unknown as Record<string, string>)[key] ?? t.err_generic;
}
export function reasonText(t: Words, reason: string | null): string {
  if (!reason) return "";
  return (t as unknown as Record<string, string>)[`chessReason_${reason.replace(/-/g, "_")}`] ?? reason;
}

export function Board({
  t,
  snap,
  orient,
  mine,
  selected,
  targets,
  pending,
  onSquare,
  onPromote,
}: {
  t: Words;
  snap: Snap;
  orient: Color;
  mine: Color;
  selected: Square | null;
  targets: Move[];
  pending: Pending | null;
  onSquare: (sq: Square) => void;
  onPromote: (p: PieceSymbol) => void;
}) {
  const board = snap.board;
  const lastMove = snap.history.at(-1);
  const rows = orient === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orient === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const kingInCheck = snap.check ? board.flat().find((p) => p && p.type === "k" && p.color === snap.turn)?.square : undefined;
  return (
    <div className="os-chess-boardwrap">
      <div className="os-chess-board" role="grid" aria-label={t.chessTitle}>
        {rows.map((r) =>
          cols.map((c) => {
            const sq = `${FILES[c]}${8 - r}` as Square;
            const p = board[r][c];
            const dark = (r + c) % 2 === 1;
            const target = targets.find((m) => m.to === sq);
            const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
            return (
              <button
                key={sq}
                role="gridcell"
                aria-label={`${sq}${p ? ` ${p.color === "w" ? "white" : "black"} ${p.type}` : ""}`}
                className={`os-sq ${dark ? "is-dark" : "is-light"} ${selected === sq ? "is-sel" : ""} ${isLast ? "is-last" : ""} ${kingInCheck === sq ? "is-check" : ""}`}
                onClick={() => onSquare(sq)}
              >
                {p && <span className={`os-piece ${p.color === "w" ? "is-white" : "is-black"}`}>{GLYPH[p.type]}&#xFE0E;</span>}
                {target && <i className={`os-hint ${p ? "is-capture" : ""}`} />}
                {c === (orient === "w" ? 0 : 7) && <em className="os-rank">{8 - r}</em>}
                {r === (orient === "w" ? 7 : 0) && <em className="os-file">{FILES[c]}</em>}
              </button>
            );
          }),
        )}
        {pending && (
          <div className="os-promote" role="dialog" aria-label={t.chessPromote}>
            <p>{t.chessPromote}</p>
            <div>
              {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                <button key={p} onClick={() => onPromote(p)} aria-label={p}>
                  <span className={`os-piece ${mine === "w" ? "is-white" : "is-black"}`}>{GLYPH[p]}&#xFE0E;</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayerBar({ name, sub, taken, me }: { name: string; sub?: string; taken: PieceSymbol[]; me?: boolean }) {
  return (
    <div className="os-chess-bar">
      <div className="os-chess-who">
        <i className={`os-chess-avatar ${me ? "is-me" : ""}`}>{name.slice(0, 1).toUpperCase()}</i>
        <div>
          <b>{name}</b>
          {sub && <small>{sub}</small>}
        </div>
      </div>
      <span className="os-chess-taken">{taken.map((p) => GLYPH[p]).join("")}</span>
    </div>
  );
}

export function capturedBy(history: Move[]): Record<Color, PieceSymbol[]> {
  const c: Record<Color, PieceSymbol[]> = { w: [], b: [] };
  history.forEach((m) => m.captured && c[m.color].push(m.captured));
  return c;
}

export function MoveList({ t, history }: { t: Words; history: Move[] }) {
  const sans = history.map((m) => m.san);
  const pairs: [string, string?][] = [];
  for (let i = 0; i < sans.length; i += 2) pairs.push([sans[i], sans[i + 1]]);
  return (
    <>
      <h3 className="os-h3">{t.chessMoves}</h3>
      <ol className="os-chess-moves">
        {pairs.map(([a, b], i) => (
          <li key={i}>
            <span>{i + 1}.</span> {a} <b>{b}</b>
          </li>
        ))}
      </ol>
    </>
  );
}
