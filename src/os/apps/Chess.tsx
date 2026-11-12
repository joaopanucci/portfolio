"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCw, Undo2 } from "lucide-react";
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { EngineMove, Level } from "../chess/engine";
import type { AppProps } from "./types";

const GLYPH: Record<PieceSymbol, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const FILES = "abcdefgh";
const LEVELS: Level[] = ["easy", "medium", "hard"];

type Pending = { from: Square; to: Square };
type Snap = {
  board: ReturnType<Chess["board"]>;
  history: Move[];
  turn: Color;
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  over: boolean;
};
const snapshot = (g: Chess): Snap => ({
  board: g.board(),
  history: g.history({ verbose: true }),
  turn: g.turn(),
  check: g.isCheck(),
  checkmate: g.isCheckmate(),
  stalemate: g.isStalemate(),
  over: g.isGameOver(),
});

function useEngine() {
  const worker = useRef<Worker | null>(null);
  const waiting = useRef(new Map<number, (m: EngineMove | null) => void>());
  const seq = useRef(0);
  useEffect(() => {
    try {
      const w = new Worker(new URL("../chess/worker.ts", import.meta.url), { type: "module" });
      w.onmessage = (e: MessageEvent<{ id: number; move: EngineMove | null }>) => {
        waiting.current.get(e.data.id)?.(e.data.move);
        waiting.current.delete(e.data.id);
      };
      worker.current = w;
    } catch {
      worker.current = null;
    }
    const pending = waiting.current;
    return () => {
      worker.current?.terminate();
      pending.clear();
    };
  }, []);
  return useCallback((fen: string, level: Level) => {
    const id = ++seq.current;
    return new Promise<EngineMove | null>((resolve) => {
      if (worker.current) {
        waiting.current.set(id, resolve);
        worker.current.postMessage({ id, fen, level });
      } else {
        // no Worker support: search on the main thread with a lighter level
        void import("../chess/engine").then(({ bestMove }) => resolve(bestMove(fen, level === "hard" ? "medium" : level)));
      }
    });
  }, []);
}

export function ChessApp({ t, toast }: AppProps) {
  const game = useRef(new Chess());
  const [snap, setSnap] = useState<Snap>(() => snapshot(new Chess()));
  const [targets, setTargets] = useState<Move[]>([]);
  const [level, setLevel] = useState<Level>("medium");
  const [mine, setMine] = useState<Color>("w");
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [thinking, setThinking] = useState(false);
  const [say, setSay] = useState<string>("");
  const token = useRef(0);
  const ask = useEngine();
  const refresh = useCallback(() => setSnap(snapshot(game.current)), []);

  const lastMove = snap.history.at(-1);
  const over = snap.over;
  const myTurn = snap.turn === mine && !over;

  const botMove = useCallback(
    async (lvl: Level) => {
      const my = ++token.current;
      setThinking(true);
      const started = Date.now();
      const move = await ask(game.current.fen(), lvl);
      // never answer instantly: a short pause feels like someone thinking
      const wait = Math.max(0, 450 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      if (my !== token.current || !move) return;
      const played = game.current.move(move);
      setThinking(false);
      if (game.current.isCheckmate()) setSay(t.chessSayLose);
      else if (game.current.isCheck()) setSay(t.chessSayCheck);
      else if (played.captured) setSay(t.chessSayCapture);
      else setSay("");
      refresh();
    },
    [ask, t, refresh],
  );

  const newGame = useCallback(
    (color: Color, lvl: Level) => {
      token.current++;
      game.current = new Chess();
      setMine(color);
      setFlipped(false);
      setSelected(null);
      setTargets([]);
      setPending(null);
      setThinking(false);
      setSay(t.chessSayStart);
      refresh();
      if (color === "b") void botMove(lvl);
    },
    [botMove, t, refresh],
  );

  const play = (from: Square, to: Square, promotion?: string) => {
    const g = game.current;
    try {
      const m = g.move({ from, to, promotion });
      setSelected(null);
      setTargets([]);
      setPending(null);
      if (g.isCheckmate()) {
        setSay(t.chessSayWin);
        toast(t.chessTitle, t.chessWin);
      } else if (g.isGameOver()) setSay("");
      else {
        setSay(m.captured ? t.chessSayMine : "");
        void botMove(level);
      }
      refresh();
    } catch {
      setSelected(null);
      setTargets([]);
    }
  };

  const click = (sq: Square) => {
    if (!myTurn || thinking || pending) return;
    const piece = game.current.get(sq);
    if (selected) {
      const legal = targets.find((m) => m.to === sq);
      if (legal) {
        if (legal.promotion) setPending({ from: selected, to: sq });
        else play(selected, sq);
        return;
      }
    }
    const mineHere = !!piece && piece.color === mine;
    setSelected(mineHere ? sq : null);
    setTargets(mineHere ? game.current.moves({ square: sq, verbose: true }) : []);
  };

  const board = snap.board;
  const orient = (flipped ? !(mine === "b") : mine === "b") ? "b" : "w";
  const rows = orient === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orient === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const kingInCheck = snap.check ? board.flat().find((p) => p && p.type === "k" && p.color === snap.turn)?.square : undefined;

  const status = over
    ? snap.checkmate
      ? snap.turn === mine
        ? t.chessLose
        : t.chessWin
      : snap.stalemate
        ? t.chessStalemate
        : t.chessDraw
    : thinking
      ? t.chessThinking
      : snap.check && snap.turn === mine
        ? t.chessCheck
        : myTurn
          ? t.chessYourTurn
          : "";

  const sans = snap.history.map((m) => m.san);
  const pairs: [string, string?][] = [];
  for (let i = 0; i < sans.length; i += 2) pairs.push([sans[i], sans[i + 1]]);
  const captured = useMemo(() => {
    const c: Record<Color, PieceSymbol[]> = { w: [], b: [] };
    snap.history.forEach((m) => m.captured && c[m.color].push(m.captured));
    return c;
  }, [snap.history]);
  const levelLabel: Record<Level, string> = { easy: t.chessEasy, medium: t.chessMedium, hard: t.chessHard };

  return (
    <div className="os-chess">
      <section className="os-chess-main">
        <div className="os-chess-bar">
          <div className="os-chess-who">
            <i className="os-chess-avatar">J</i>
            <div>
              <b>João-Bot</b>
              <small>{levelLabel[level]}</small>
            </div>
          </div>
          <span className="os-chess-taken">{captured[mine === "w" ? "w" : "b"].map((p) => GLYPH[p]).join("")}</span>
        </div>

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
                    onClick={() => click(sq)}
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
                    <button key={p} onClick={() => play(pending.from, pending.to, p)} aria-label={p}>
                      <span className={`os-piece ${mine === "w" ? "is-white" : "is-black"}`}>{GLYPH[p]}&#xFE0E;</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="os-chess-bar">
          <div className="os-chess-who">
            <i className="os-chess-avatar is-me">{t.chessYou.slice(0, 1)}</i>
            <div>
              <b>{t.chessYou}</b>
              <small>{mine === "w" ? t.chessWhite : t.chessBlack}</small>
            </div>
          </div>
          <span className="os-chess-taken">{captured[mine === "w" ? "b" : "w"].map((p) => GLYPH[p]).join("")}</span>
        </div>
      </section>

      <aside className="os-chess-side">
        <div className={`os-chess-status ${over ? "is-over" : ""}`} role="status" aria-live="polite">
          <b>{status}</b>
          {say && <p>“{say}”</p>}
        </div>
        <p className="os-muted os-chess-intro">{t.chessIntro}</p>

        <div className="os-chess-row">
          <span>{t.chessLevel}</span>
          <div className="os-seg is-compact" role="radiogroup" aria-label={t.chessLevel}>
            {LEVELS.map((l) => (
              <button key={l} role="radio" aria-checked={level === l} className={level === l ? "is-sel" : ""} onClick={() => setLevel(l)}>
                {levelLabel[l]}
              </button>
            ))}
          </div>
        </div>
        <div className="os-chess-row">
          <span>{t.chessSide}</span>
          <div className="os-seg is-compact" role="radiogroup" aria-label={t.chessSide}>
            {(["w", "b"] as Color[]).map((c) => (
              <button key={c} role="radio" aria-checked={mine === c} className={mine === c ? "is-sel" : ""} onClick={() => newGame(c, level)}>
                {c === "w" ? t.chessWhite : t.chessBlack}
              </button>
            ))}
          </div>
        </div>

        <div className="os-chess-controls">
          <button className="os-btn is-primary" onClick={() => newGame(mine, level)}>
            <Plus size={14} />
            {t.chessNew}
          </button>
          <button
            className="os-btn"
            disabled={sans.length < 1 || thinking}
            onClick={() => {
              token.current++;
              const g = game.current;
              g.undo();
              if (g.turn() !== mine && g.history().length) g.undo();
              setSelected(null);
              setTargets([]);
              setSay("");
              refresh();
            }}
          >
            <Undo2 size={14} />
            {t.chessUndo}
          </button>
          <button className="os-btn" onClick={() => setFlipped((f) => !f)}>
            <RefreshCw size={14} />
            {t.chessFlip}
          </button>
        </div>

        <h3 className="os-h3">{t.chessMoves}</h3>
        <ol className="os-chess-moves">
          {pairs.map(([a, b], i) => (
            <li key={i}>
              <span>{i + 1}.</span> {a} <b>{b}</b>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
