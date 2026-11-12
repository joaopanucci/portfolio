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
        className="os-boot-star"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <svg viewBox="0 0 100 100" aria-hidden>
          <defs>
            <radialGradient id="boot-glow">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.35" stopColor="#ffd37a" />
              <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#boot-glow)" opacity="0.55" />
          <path d="M50 6 L57 43 L94 50 L57 57 L50 94 L43 57 L6 50 L43 43 Z" fill="#fff" />
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
