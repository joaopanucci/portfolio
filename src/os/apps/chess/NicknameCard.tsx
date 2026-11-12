"use client";
import { useState } from "react";
import { ApiFail, call } from "../../chess/online";
import type { Player } from "../../chess/service";
import type { Words } from "../../i18n";
import { errorText } from "./shared";

/** Asks for a nickname and creates the player's profile (and anonymous account) on the server. */
export function NicknameCard({ t, initial = "", prompt, onSaved }: { t: Words; initial?: string; prompt?: string; onSaved: (p: Player) => void }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form
      className="os-nick"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
          const res = await call<{ player: Player }>({ action: "profile", nickname: name });
          onSaved(res.player);
        } catch (x) {
          setErr(errorText(t, x instanceof ApiFail ? x.message : "generic"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>{prompt ?? t.chessNickPrompt}</p>
      <div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.chessNickPlaceholder} aria-label={t.chessNickPlaceholder} maxLength={20} autoComplete="nickname" spellCheck={false} />
        <button className="os-btn is-primary" disabled={busy || name.trim().length < 2}>
          {busy ? t.chessSaving : t.chessSave}
        </button>
      </div>
      {err && <small className="os-nick-err">{err}</small>}
    </form>
  );
}
