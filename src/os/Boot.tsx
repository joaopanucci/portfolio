"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import type { Words } from "./i18n";

export function Boot({ t, autoSkip, onDone }: { t: Words; autoSkip: boolean; onDone: () => void }) {
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("joaoos-booted") === "1";
    } catch {
      /* storage may be blocked */
    }
    if (seen || autoSkip) {
      onDone();
      return;
    }
    const timer = window.setTimeout(onDone, 2600);
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onDone, autoSkip]);
  return (
    <motion.div className="os-boot" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}>
      <motion.div
        className="os-boot-mark"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <svg viewBox="0 0 100 100" aria-hidden>
          <defs>
            <radialGradient id="boot-glow">
              <stop offset="0" stopColor="#22b8ff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#22b8ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#boot-glow)" />
          <g stroke="#22b8ff" strokeWidth="3.2" strokeLinecap="round" fill="none">
            <path d="M40 34V18M50 34V12M60 34V18M40 66V82M50 66V88M60 66V82M34 40H18M34 50H12M34 60H18M66 40H82M66 50H88M66 60H82" />
          </g>
          <rect x="32" y="32" width="36" height="36" rx="6" fill="#06203a" stroke="#22b8ff" strokeWidth="3.4" />
          <rect x="42" y="42" width="16" height="16" rx="3" fill="#22b8ff" />
        </svg>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        {t.osName}
        <span>{t.edition}</span>
      </motion.h1>
      <div className="os-boot-bar" aria-hidden>
        <motion.i initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }} />
      </div>
      <p>{t.bootSkip}</p>
    </motion.div>
  );
}
