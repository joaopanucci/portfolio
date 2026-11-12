"use client";
import { useState } from "react";
import { Languages, Palette, Wind } from "lucide-react";
import { languageLabel, languages } from "../i18n";
import type { Preferences } from "../preferences";
import type { AppProps } from "./types";

const accents: { id: Preferences["accent"]; color: string; key: "cyan" | "violet" | "amber" }[] = [
  { id: "cyan", color: "#22b8ff", key: "cyan" },
  { id: "violet", color: "#a78bfa", key: "violet" },
  { id: "amber", color: "#fbbf24", key: "amber" },
];

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="os-row">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" role="switch" className="os-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsApp({ t, prefs, update }: AppProps) {
  const sections = [
    { id: "look", icon: Palette, label: t.settingsAppearance },
    { id: "lang", icon: Languages, label: t.settingsLanguage },
    { id: "motion", icon: Wind, label: t.settingsMotion },
  ] as const;
  const [section, setSection] = useState<(typeof sections)[number]["id"]>("look");
  return (
    <div className="os-split">
      <aside className="os-sidebar" aria-label={t.settings}>
        {sections.map(({ id, icon: Icon, label }) => (
          <button key={id} className={section === id ? "is-sel" : ""} onClick={() => setSection(id)}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </aside>
      <div className="os-pane">
        {section === "look" && (
          <div className="space-y-6">
            <div>
              <h3 className="os-h3">{t.accent}</h3>
              <div className="os-swatches" role="radiogroup" aria-label={t.accent}>
                {accents.map((a) => (
                  <button
                    key={a.id}
                    role="radio"
                    aria-checked={prefs.accent === a.id}
                    aria-label={t[a.key]}
                    className={prefs.accent === a.id ? "is-sel" : ""}
                    style={{ background: a.color }}
                    onClick={() => update({ accent: a.id })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {section === "lang" && (
          <div className="os-seg" role="radiogroup" aria-label={t.language}>
            {languages.map((l) => (
              <button key={l} role="radio" aria-checked={prefs.language === l} className={prefs.language === l ? "is-sel" : ""} onClick={() => update({ language: l })}>
                {languageLabel[l]}
              </button>
            ))}
          </div>
        )}
        {section === "motion" && (
          <div className="os-rows">
            <Toggle label={t.reduce} hint={t.reduceHint} checked={prefs.reduce} onChange={(reduce) => update({ reduce })} />
            <Toggle label={t.magnify} checked={prefs.magnify} onChange={(magnify) => update({ magnify })} />
          </div>
        )}
      </div>
    </div>
  );
}
