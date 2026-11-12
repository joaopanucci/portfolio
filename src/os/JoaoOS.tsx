"use client";
import { useCallback, useState } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import { Boot } from "./Boot";
import { BrainRun } from "./BrainRun";
import { Desktop } from "./Desktop";
import { locales, words } from "./i18n";
import { LockScreen } from "./LockScreen";
import { usePreferences, useSystemReducedMotion } from "./preferences";
import { Wallpaper } from "./Wallpaper";
import "./os.css";

type Phase = "boot" | "lock" | "desktop";

export function JoaoOS() {
  const [prefs, update] = usePreferences();
  const systemReduced = useSystemReducedMotion();
  const reduced = systemReduced || prefs.reduce;
  const [phase, setPhase] = useState<Phase>("boot");
  const [running, setRunning] = useState(false);
  const t = words[prefs.language];

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem("joaoos-booted", "1");
    } catch {
      /* storage may be blocked */
    }
    setPhase((p) => (p === "boot" ? "lock" : p));
  }, []);

  const tint = { cyan: "#22b8ff", violet: "#a78bfa", amber: "#fbbf24" }[prefs.accent];
  const enter = () => {
    if (running) return;
    if (reduced) setPhase("desktop");
    else setRunning(true);
  };

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <div
        className={`joaoos ${reduced ? "os-reduced" : ""}`}
        lang={locales[prefs.language]}
        data-accent={prefs.accent}
      >
        <Wallpaper reduced={reduced} accent={prefs.accent} locked={phase !== "desktop"} />
        <AnimatePresence mode="wait">
          {phase === "boot" && <Boot key="boot" t={t} autoSkip={reduced} onDone={finishBoot} />}
          {phase === "lock" && (
            <LockScreen
              key="lock"
              t={t}
              language={prefs.language}
              onLanguage={(language) => update({ language })}
              leaving={running}
              onEnter={enter}
            />
          )}
        </AnimatePresence>
        {running && <BrainRun tint={tint} onUnlock={() => setPhase("desktop")} onDone={() => setRunning(false)} />}
        {phase === "desktop" && (
          <Desktop prefs={prefs} update={update} reduced={reduced} onLock={() => setPhase("lock")} />
        )}
      </div>
    </MotionConfig>
  );
}
