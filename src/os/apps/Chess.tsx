"use client";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { myProfile, onlineEnabled, readLocal } from "../chess/online";
import { CODE_RE } from "../chess/rules";
import type { Player } from "../chess/service";
import { BotGame } from "./chess/BotGame";
import { NicknameCard } from "./chess/NicknameCard";
import { OnlineGame } from "./chess/OnlineGame";
import { Ranking } from "./chess/Ranking";
import type { AppProps } from "./types";

type Tab = "play" | "online" | "rank";

export function ChessApp({ t, arg, toast }: AppProps) {
  const [tab, setTab] = useState<Tab>("play");
  const [profile, setProfile] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);
  const [invite, setInvite] = useState<string | undefined>();
  const [seen, setSeen] = useState(0);
  const [local, setLocal] = useState(() => (onlineEnabled ? null : readLocal()));

  // invitation link (?xadrez=CODE) or a code handed over by another app
  if (arg && arg.nonce !== seen) {
    setSeen(arg.nonce);
    const c = arg.value.toUpperCase();
    if (CODE_RE.test(c)) {
      setInvite(c);
      setTab("online");
    }
  }

  useEffect(() => {
    if (!onlineEnabled) return;
    let alive = true;
    myProfile()
      .then((p) => alive && setProfile(p))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // keep the browser-only score fresh after a bot game when there is no online profile
  useEffect(() => {
    if (onlineEnabled) return;
    const id = window.setInterval(() => setLocal(readLocal()), 2000);
    return () => window.clearInterval(id);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "play", label: t.chessTabPlay },
    { id: "online", label: t.chessTabOnline },
    { id: "rank", label: t.chessTabRank },
  ];

  return (
    <div className="os-chess-shell">
      <header className="os-chess-head">
        <div className="os-seg is-compact" role="tablist">
          {tabs.map((x) => (
            <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? "is-sel" : ""} onClick={() => setTab(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="os-chess-me">
          {profile ? (
            <>
              <b>{profile.nickname}</b>
              <span>
                {profile.points} {t.chessPoints} · {profile.rating}
              </span>
              <button className="os-btn" aria-label={t.chessEditNick} title={t.chessEditNick} onClick={() => setEditing((e) => !e)}>
                <Pencil size={13} />
              </button>
            </>
          ) : onlineEnabled ? (
            <button className="os-btn" onClick={() => setEditing((e) => !e)}>
              {t.chessSave} · {t.chessNickPlaceholder}
            </button>
          ) : (
            <span>
              {local?.points ?? 0} {t.chessPoints}
            </span>
          )}
        </div>
      </header>

      {editing && (
        <div className="os-chess-edit">
          <NicknameCard
            t={t}
            initial={profile?.nickname}
            onSaved={(p) => {
              setProfile(p);
              setEditing(false);
            }}
          />
        </div>
      )}

      <div className="os-chess-view">
        {tab === "play" && <BotGame t={t} profile={profile} onProfile={setProfile} toast={toast} />}
        {tab === "online" && <OnlineGame t={t} profile={profile} onProfile={setProfile} initialCode={invite} toast={toast} />}
        {tab === "rank" && <Ranking t={t} me={profile} />}
      </div>
    </div>
  );
}
