"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { leaderboard, onlineEnabled, readLocal } from "../../chess/online";
import type { Player } from "../../chess/service";
import type { Words } from "../../i18n";

export function Ranking({ t, me }: { t: Words; me: Player | null }) {
  const [rows, setRows] = useState<Player[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!onlineEnabled) return;
    let alive = true;
    leaderboard()
      .then((r) => alive && (setRows(r), setFailed(false)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [tick]);

  if (!onlineEnabled) {
    const local = readLocal();
    return (
      <div className="os-rank">
        <h2>{t.chessRankTitle}</h2>
        <p className="os-muted">{t.chessNotConfigured}</p>
        <div className="os-rank-local">
          <b>{local.points}</b> {t.chessPoints} · {local.wins}/{local.games} {t.chessRankWins.toLowerCase()}
          <small>{t.chessLocalOnly}</small>
        </div>
      </div>
    );
  }
  return (
    <div className="os-rank">
      <div className="os-rank-head">
        <h2>{t.chessRankTitle}</h2>
        <button className="os-btn" onClick={() => setTick((n) => n + 1)}>
          <RefreshCw size={14} />
          {t.chessRefresh}
        </button>
      </div>
      {failed && <p className="os-nick-err">{t.err_generic}</p>}
      {rows && rows.length === 0 && <p className="os-muted">{t.chessRankEmpty}</p>}
      {rows && rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{t.chessRankPlayer}</th>
              <th>{t.chessPoints}</th>
              <th>{t.chessRating}</th>
              <th>{t.chessRankWins}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className={p.id === me?.id ? "is-me" : ""}>
                <td>{i + 1}</td>
                <td>
                  {p.nickname}
                  {p.id === me?.id && <em> · {t.chessYourRank}</em>}
                </td>
                <td>{p.points}</td>
                <td>{p.rating}</td>
                <td>
                  {p.wins}/{p.games}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
