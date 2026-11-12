"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Flag, Handshake, Link2, LogIn, Plus, X } from "lucide-react";
import type { Color, Move, PieceSymbol, Square } from "chess.js";
import { ApiFail, call, fetchGame, myGames, myProfile, onlineEnabled, players, watchGame } from "../../chess/online";
import { CODE_RE, replay } from "../../chess/rules";
import type { GameRow, Player } from "../../chess/service";
import type { Words } from "../../i18n";
import { NicknameCard } from "./NicknameCard";
import { Board, MoveList, PlayerBar, capturedBy, errorText, reasonText, snapshot, toUci, type Pending } from "./shared";

const IDLE_CLAIM_MS = 5 * 60_000;

export function OnlineGame({
  t,
  profile,
  onProfile,
  initialCode,
  toast,
}: {
  t: Words;
  profile: Player | null;
  onProfile: (p: Player) => void;
  initialCode?: string;
  toast: (title: string, body?: string) => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [row, setRow] = useState<GameRow | null>(null);
  const [opp, setOpp] = useState<Player | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinText, setJoinText] = useState("");
  const [color, setColor] = useState<"random" | Color>("random");
  const [list, setList] = useState<GameRow[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [optimistic, setOptimistic] = useState<{ uci: string; base: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const autoJoined = useRef<string | null>(null);

  const me = profile?.id ?? null;
  const side: Color | null = row && me ? (row.white_id === me ? "w" : row.black_id === me ? "b" : null) : null;

  const fail = useCallback((e: unknown) => setErr(errorText(t, e instanceof ApiFail ? e.message : "generic")), [t]);

  // join a game by code (also used by invitation links)
  const joinCode = useCallback(
    async (raw: string) => {
      const c = raw.trim().toUpperCase();
      if (!CODE_RE.test(c)) return setErr(t.err_code_invalid);
      setBusy(true);
      setErr("");
      try {
        const res = await call<{ game: GameRow }>({ action: "join", code: c });
        setRow(res.game);
        setCode(res.game.code);
      } catch (e) {
        fail(e);
      } finally {
        setBusy(false);
      }
    },
    [fail, t],
  );

  // invitation link: join automatically once the player has a nickname
  useEffect(() => {
    if (!initialCode || !profile || autoJoined.current === initialCode) return;
    autoJoined.current = initialCode;
    void joinCode(initialCode);
  }, [initialCode, profile, joinCode]);

  // my open games, for the lobby
  useEffect(() => {
    if (!onlineEnabled || !profile || code) return;
    let alive = true;
    myGames()
      .then((g) => alive && setList(g))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [profile, code]);

  // live updates for the current game
  useEffect(() => {
    if (!code) return;
    let alive = true;
    void fetchGame(code).then((g) => alive && g && setRow((cur) => (cur && cur.updated_at > g.updated_at ? cur : g)));
    const stop = watchGame(code, (g) => setRow((cur) => (cur && cur.updated_at > g.updated_at ? cur : g)));
    return () => {
      alive = false;
      stop();
    };
  }, [code]);

  // opponent's nickname
  const oppId = row ? (row.white_id === me ? row.black_id : row.white_id) : null;
  useEffect(() => {
    if (!oppId) return;
    let alive = true;
    void players([oppId]).then((m) => alive && setOpp(m[oppId] ?? null));
    return () => {
      alive = false;
    };
  }, [oppId]);

  // tick used to unlock the "opponent is away" claim
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  // when a game finishes, refresh points and rating
  const finishedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!row || row.status !== "finished" || row.reason === "cancelled" || finishedFor.current === row.id) return;
    finishedFor.current = row.id;
    void myProfile().then((p) => p && onProfile(p));
    const won = row.result !== "draw" && (row.result === "white") === (side === "w");
    toast(t.chessTitle, row.result === "draw" ? t.chessDrawn : won ? t.chessYouWon : t.chessYouLost);
  }, [row, side, onProfile, toast, t]);

  // the move just played stays on the board until the server row catches up with it
  const inFlight = optimistic && row && optimistic.base === row.moves.length ? optimistic : null;
  const moves = useMemo(() => {
    if (!row) return [];
    return inFlight ? [...row.moves, inFlight.uci] : row.moves;
  }, [row, inFlight]);
  const chess = useMemo(() => replay(moves), [moves]);
  const snap = useMemo(() => snapshot(chess ?? replay([])!), [chess]);
  const [targets, setTargets] = useState<Move[]>([]);

  const act = async (type: string) => {
    if (!code) return;
    setBusy(true);
    setErr("");
    try {
      const res = await call<{ game: GameRow }>({ action: "act", code, type });
      setRow(res.game);
      if (res.game.reason === "cancelled") leave();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const leave = () => {
    setCode(null);
    setRow(null);
    setOpp(null);
    setSelected(null);
    setTargets([]);
    setOptimistic(null);
    setErr("");
  };

  const play = async (from: Square, to: Square, promotion?: string) => {
    if (!row || !code) return;
    const uci = toUci({ from, to, promotion: promotion as PieceSymbol | undefined });
    setOptimistic({ uci, base: row.moves.length });
    setSelected(null);
    setTargets([]);
    setPending(null);
    setErr("");
    try {
      const res = await call<{ game: GameRow }>({ action: "move", code, uci });
      setRow(res.game);
      setOptimistic(null);
    } catch (e) {
      setOptimistic(null);
      fail(e);
    }
  };

  const click = (sq: Square) => {
    if (!row || row.status !== "active" || !side || !chess || inFlight || pending) return;
    if (snap.turn !== side) return;
    const piece = chess.get(sq);
    if (selected) {
      const legal = targets.find((m) => m.to === sq);
      if (legal) {
        if (legal.promotion) setPending({ from: selected, to: sq });
        else void play(selected, sq);
        return;
      }
    }
    const mineHere = !!piece && piece.color === side;
    setSelected(mineHere ? sq : null);
    setTargets(mineHere ? chess.moves({ square: sq, verbose: true }) : []);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t.chessCopied, text);
    } catch {
      toast(text);
    }
  };

  /* ───────── not configured / no profile ───────── */
  if (!onlineEnabled) return <div className="os-chess-notice">{t.chessNotConfigured}</div>;
  if (!profile)
    return (
      <div className="os-chess-notice">
        <NicknameCard t={t} onSaved={onProfile} />
        {initialCode && <p className="os-muted">{t.chessCodeLabel}: <b>{initialCode}</b></p>}
      </div>
    );

  /* ───────── lobby ───────── */
  if (!code || !row)
    return (
      <div className="os-chess-lobby">
        <section className="os-lobby-card">
          <h3>{t.chessCreate}</h3>
          <p className="os-muted">{t.chessCreateHint}</p>
          <div className="os-chess-row">
            <span>{t.chessYouPlay}</span>
            <div className="os-seg is-compact" role="radiogroup" aria-label={t.chessYouPlay}>
              {(["random", "w", "b"] as const).map((c) => (
                <button key={c} role="radio" aria-checked={color === c} className={color === c ? "is-sel" : ""} onClick={() => setColor(c)}>
                  {c === "random" ? t.chessRandom : c === "w" ? t.chessWhite : t.chessBlack}
                </button>
              ))}
            </div>
          </div>
          <button
            className="os-btn is-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setErr("");
              try {
                const res = await call<{ game: GameRow }>({ action: "create", color });
                setRow(res.game);
                setCode(res.game.code);
              } catch (e) {
                fail(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Plus size={14} />
            {t.chessCreate}
          </button>
        </section>

        <section className="os-lobby-card">
          <h3>{t.chessJoin}</h3>
          <p className="os-muted">{t.chessJoinHint}</p>
          <form
            className="os-join"
            onSubmit={(e) => {
              e.preventDefault();
              void joinCode(joinText);
            }}
          >
            <input value={joinText} onChange={(e) => setJoinText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder={t.chessCodePlaceholder} aria-label={t.chessCodeLabel} maxLength={6} spellCheck={false} autoComplete="off" />
            <button className="os-btn is-primary" disabled={busy || joinText.length !== 6}>
              <LogIn size={14} />
              {t.chessJoin}
            </button>
          </form>
        </section>

        {list.length > 0 && (
          <section className="os-lobby-card is-wide">
            <h3>{t.chessMyGames}</h3>
            <ul>
              {list.map((g) => (
                <li key={g.id}>
                  <b>{g.code}</b>
                  <span className="os-muted">{g.status === "waiting" ? t.chessWaiting : `${g.moves.length}`}</span>
                  <button className="os-btn" onClick={() => void joinCode(g.code)}>
                    {t.chessRejoin}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {err && <p className="os-nick-err os-lobby-err">{err}</p>}
      </div>
    );

  /* ───────── a game ───────── */
  const mySide: Color = side ?? "w";
  const iAmBlack = mySide === "b";
  const finished = row.status === "finished";
  const waiting = row.status === "waiting";
  const myTurn = row.status === "active" && snap.turn === mySide;
  const idle = row.status === "active" && !myTurn && now - Date.parse(row.updated_at) >= IDLE_CLAIM_MS;
  const offerFromOpp = row.status === "active" && row.draw_offer !== null && row.draw_offer !== mySide;
  const offerFromMe = row.status === "active" && row.draw_offer === mySide;
  const captured = capturedBy(snap.history);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/?xadrez=${row.code}`;

  let status = "";
  if (waiting) status = t.chessWaiting;
  else if (finished) {
    const reason = reasonText(t, row.reason);
    const verdict = row.result === "draw" ? t.chessDrawn : (row.result === "white") === (mySide === "w") ? t.chessYouWon : t.chessYouLost;
    status = row.reason === "cancelled" ? reason : `${verdict} (${reason})`;
  } else status = myTurn ? (snap.check ? t.chessCheck : t.chessYourTurn) : t.chessOppTurn;

  return (
    <div className="os-chess">
      <section className="os-chess-main">
        <PlayerBar name={opp?.nickname ?? t.chessOpponent} sub={opp ? `${opp.rating} ${t.chessRating}` : undefined} taken={captured[iAmBlack ? "b" : "w"]} />
        <Board t={t} snap={snap} orient={iAmBlack ? "b" : "w"} mine={mySide} selected={selected} targets={targets} pending={pending} onSquare={click} onPromote={(p) => pending && void play(pending.from, pending.to, p)} />
        <PlayerBar name={profile.nickname} sub={`${mySide === "w" ? t.chessWhite : t.chessBlack} · ${profile.rating}`} taken={captured[iAmBlack ? "w" : "b"]} me />
      </section>

      <aside className="os-chess-side">
        <div className={`os-chess-status ${finished ? "is-over" : ""}`} role="status" aria-live="polite">
          <b>{status}</b>
        </div>

        {waiting && (
          <div className="os-invite">
            <small>{t.chessCodeLabel}</small>
            <strong>{row.code}</strong>
            <div className="os-chess-controls">
              <button className="os-btn is-primary" onClick={() => void copy(row.code)}>
                <Copy size={14} />
                {t.chessCopy}
              </button>
              <button className="os-btn" onClick={() => void copy(link)}>
                <Link2 size={14} />
                {t.chessCopyLink}
              </button>
              <button className="os-btn" onClick={() => void act("cancel")} disabled={busy}>
                <X size={14} />
                {t.chessCancel}
              </button>
            </div>
          </div>
        )}

        {offerFromOpp && (
          <div className="os-chess-banner">
            <b>{t.chessDrawOffered}</b>
            <div className="os-chess-controls">
              <button className="os-btn is-primary" onClick={() => void act("accept_draw")} disabled={busy}>
                {t.chessAcceptDraw}
              </button>
              <button className="os-btn" onClick={() => void act("decline_draw")} disabled={busy}>
                {t.chessDeclineDraw}
              </button>
            </div>
          </div>
        )}
        {offerFromMe && <p className="os-muted os-chess-intro">{t.chessDrawWaiting}</p>}

        {row.status === "active" && (
          <div className="os-chess-controls">
            <button className="os-btn" onClick={() => void act("offer_draw")} disabled={busy || offerFromMe}>
              <Handshake size={14} />
              {t.chessOfferDraw}
            </button>
            <button className="os-btn" onClick={() => void act("resign")} disabled={busy}>
              <Flag size={14} />
              {t.chessResign}
            </button>
            {idle && (
              <button className="os-btn is-primary" onClick={() => void act("claim_timeout")} disabled={busy}>
                {t.chessClaimTimeout}
              </button>
            )}
          </div>
        )}
        {(finished || waiting) && !waiting && (
          <div className="os-chess-controls">
            <button className="os-btn is-primary" onClick={leave}>
              <Plus size={14} />
              {t.chessNew}
            </button>
          </div>
        )}
        {err && <p className="os-nick-err">{err}</p>}
        <p className="os-chess-code">
          {t.chessCodeLabel}: <b>{row.code}</b>
        </p>
        <MoveList t={t} history={snap.history} />
      </aside>
    </div>
  );
}
