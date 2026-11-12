"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, Plus, RefreshCw, Undo2 } from "lucide-react";
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { Level } from "../../chess/fast";
import { ApiFail, addLocal, call, onlineEnabled } from "../../chess/online";
import { botPoints, type BotLevel } from "../../chess/rules";
import type { Player } from "../../chess/service";
import { useEngine } from "../../chess/useEngine";
import type { Words } from "../../i18n";
import { NicknameCard } from "./NicknameCard";
import { Board, MoveList, PlayerBar, capturedBy, errorText, snapshot, toUci, type Pending, type Snap } from "./shared";

const LEVELS: Level[] = ["easy", "medium", "hard", "master"];
type Banner = { points: number; local: boolean; note?: string };

function evalText(score: number): string {
  if (Math.abs(score) > 29000) return `#${Math.ceil((30000 - Math.abs(score)) / 2)}`;
  const v = score / 100;
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

export function BotGame({ t, profile, onProfile, toast }: { t: Words; profile: Player | null; onProfile: (p: Player) => void; toast: (title: string, body?: string) => void }) {
  const game = useRef(new Chess());
  const [snap, setSnap] = useState<Snap>(() => snapshot(new Chess()));
  const [targets, setTargets] = useState<Move[]>([]);
  const [level, setLevel] = useState<Level>("medium");
  const [mine, setMine] = useState<Color>("w");
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [thinking, setThinking] = useState(false);
  const [say, setSay] = useState("");
  const [info, setInfo] = useState<{ score: number; depth: number } | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [resigned, setResigned] = useState(false);
  const token = useRef(0);
  const submitted = useRef(false);
  const usedUndo = useRef(false);
  const ask = useEngine();
  const refresh = useCallback(() => setSnap(snapshot(game.current)), []);

  const over = snap.over || resigned;
  const myTurn = snap.turn === mine && !over;

  /** Records the finished game: on the server when the player has a profile, otherwise in this browser. */
  const submit = useCallback(
    async (didResign: boolean, lvl: Level, color: Color) => {
      if (submitted.current) return;
      submitted.current = true;
      if (usedUndo.current) {
        setBanner({ points: 0, local: true, note: t.chessNoPointsUndo });
        return;
      }
      const g = game.current;
      const moves = g.history({ verbose: true }).map(toUci);
      if (!moves.length) return;
      const mate = g.isCheckmate();
      const won = mate && g.turn() !== color;
      const draw = g.isDraw() && !mate;
      const outcome: "win" | "loss" | "draw" = didResign ? "loss" : draw ? "draw" : won ? "win" : "loss";
      if (onlineEnabled && profile) {
        try {
          const res = await call<{ points: number; player: Player }>({ action: "bot-result", level: lvl, color, moves, resigned: didResign });
          onProfile(res.player);
          setBanner({ points: res.points, local: false });
        } catch (e) {
          const code = e instanceof ApiFail ? e.message : "generic";
          setBanner({ points: 0, local: false, note: code === "too-short" ? t.chessTooShort : errorText(t, code) });
        }
      } else {
        const short = outcome === "win" && moves.length < 8;
        const pts = short ? 0 : botPoints(lvl as BotLevel, outcome, Math.ceil(moves.length / 2));
        addLocal(pts, outcome === "win" && !short);
        setBanner({ points: pts, local: true, note: short ? t.chessTooShort : undefined });
      }
    },
    [profile, onProfile, t],
  );

  const botMove = useCallback(
    async (lvl: Level, color: Color) => {
      const my = ++token.current;
      setThinking(true);
      const started = Date.now();
      const thought = await ask(game.current.fen(), lvl);
      await new Promise((r) => setTimeout(r, Math.max(0, 450 - (Date.now() - started))));
      if (my !== token.current || !thought.move) return;
      const played = game.current.move(thought.move);
      setThinking(false);
      setInfo({ score: -thought.score, depth: thought.depth });
      if (game.current.isCheckmate()) setSay(t.chessSayLose);
      else if (game.current.isCheck()) setSay(t.chessSayCheck);
      else if (played.captured) setSay(t.chessSayCapture);
      else setSay("");
      refresh();
      if (game.current.isGameOver()) void submit(false, lvl, color);
    },
    [ask, t, refresh, submit],
  );

  const newGame = useCallback(
    (color: Color, lvl: Level) => {
      token.current++;
      submitted.current = false;
      usedUndo.current = false;
      game.current = new Chess();
      setMine(color);
      setFlipped(false);
      setSelected(null);
      setTargets([]);
      setPending(null);
      setThinking(false);
      setResigned(false);
      setBanner(null);
      setInfo(null);
      setSay(t.chessSayStart);
      refresh();
      if (color === "b") void botMove(lvl, color);
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
      refresh();
      if (g.isCheckmate()) {
        setSay(t.chessSayWin);
        toast(t.chessTitle, t.chessWin);
        void submit(false, level, mine);
      } else if (g.isGameOver()) {
        setSay("");
        void submit(false, level, mine);
      } else {
        setSay(m.captured ? t.chessSayMine : "");
        void botMove(level, mine);
      }
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

  const resign = () => {
    token.current++;
    setThinking(false);
    setResigned(true);
    void submit(true, level, mine);
  };

  // when a profile is created after a game, nothing is re-sent: points are only recorded at the end of a game
  useEffect(() => () => void token.current++, []);

  const orient: Color = (flipped ? mine === "w" : mine === "b") ? "b" : "w";
  const captured = useMemo(() => capturedBy(snap.history), [snap.history]);
  const levelLabel: Record<Level, string> = { easy: t.chessEasy, medium: t.chessMedium, hard: t.chessHard, master: t.chessMaster };

  const status = over
    ? resigned
      ? t.chessLose
      : snap.checkmate
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

  return (
    <div className="os-chess">
      <section className="os-chess-main">
        <PlayerBar name="João-Bot" sub={levelLabel[level]} taken={captured[mine]} />
        <Board t={t} snap={snap} orient={orient} mine={mine} selected={selected} targets={targets} pending={pending} onSquare={click} onPromote={(p: PieceSymbol) => pending && play(pending.from, pending.to, p)} />
        <PlayerBar name={profile?.nickname ?? t.chessYou} sub={mine === "w" ? t.chessWhite : t.chessBlack} taken={captured[mine === "w" ? "b" : "w"]} me />
      </section>

      <aside className="os-chess-side">
        <div className={`os-chess-status ${over ? "is-over" : ""}`} role="status" aria-live="polite">
          <b>{status}</b>
          {say && <p>“{say}”</p>}
          {info && !over && (
            <p className="os-chess-eval">
              {t.chessEval} {evalText(info.score)} · {t.chessDepth} {info.depth}
            </p>
          )}
        </div>

        {banner && (
          <div className="os-chess-banner">
            {banner.points > 0 ? (
              <b>
                {t.chessGained} +{banner.points} {t.chessPoints}
              </b>
            ) : null}
            {banner.note && <small>{banner.note}</small>}
            {banner.local && banner.points > 0 && <small>{t.chessLocalOnly}</small>}
          </div>
        )}
        {over && !profile && onlineEnabled && <NicknameCard t={t} onSaved={onProfile} />}

        <p className="os-muted os-chess-intro">{t.chessIntro}</p>
        <div className="os-chess-row">
          <span>{t.chessLevel}</span>
          <div className="os-seg is-compact" role="radiogroup" aria-label={t.chessLevel}>
            {LEVELS.map((l) => (
              <button key={l} role="radio" aria-checked={level === l} className={level === l ? "is-sel" : ""} onClick={() => setLevel(l)} disabled={thinking}>
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
            disabled={snap.history.length < 1 || thinking || over}
            onClick={() => {
              token.current++;
              usedUndo.current = true;
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
          <button className="os-btn" onClick={resign} disabled={over || snap.history.length < 1}>
            <Flag size={14} />
            {t.chessResign}
          </button>
        </div>
        <MoveList t={t} history={snap.history} />
      </aside>
    </div>
  );
}
