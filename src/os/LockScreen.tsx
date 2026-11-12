"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Globe } from "lucide-react";
import { languageLabel, languages, locales, type Language, type Words } from "./i18n";

function Hud({ label }: { label: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="os-hud" aria-hidden>
      <span className="os-hud-tl">
        ISO 200 · 5600K
        <br />
        1/60 · F2.8
      </span>
      <span className="os-hud-tr">
        <b className="rec">●</b> REC {mm}:{ss}
        <br />
        8K · 60FPS
      </span>
      <span className="os-hud-bl">{label}</span>
    </div>
  );
}

export function LockScreen({
  t,
  language,
  onLanguage,
  onEnter,
}: {
  t: Words;
  language: Language;
  onLanguage: (l: Language) => void;
  onEnter: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onEnter]);

  const locale = locales[language];
  return (
    <motion.div
      className="os-lock"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: "blur(14px)" }}
      transition={{ duration: 0.7 }}
    >
      <Hud label={t.edition} />
      <div className="os-languages" role="group" aria-label={t.language}>
        <Globe size={15} aria-hidden />
        {languages.map((l) => (
          <button key={l} aria-pressed={language === l} onClick={() => onLanguage(l)}>
            {languageLabel[l]}
          </button>
        ))}
      </div>

      <div className="os-lock-center">
        <motion.p
          className="os-lock-date"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {now
            ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now)
            : " "}
        </motion.p>
        <motion.div
          className="os-lock-time"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.8 }}
        >
          {now ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(now) : "--:--"}
        </motion.div>

        <motion.div
          className="os-neon"
          aria-label={t.quote}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1.2 }}
        >
          <span className="r">universe</span>
          <span className="w">.</span>
          <span className="b">work</span>
          <span className="w">( </span>
          <span className="r">inFavor</span>
          <span className="w"> )</span>
        </motion.div>
        <motion.p className="os-lock-quote" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1 }}>
          {t.quote}
        </motion.p>
      </div>

      <motion.div
        className="os-lock-user"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 22 }}
      >
        <div className="os-avatar" aria-hidden>
          JP
        </div>
        <h1>João Panucci</h1>
        <p>{t.intro}</p>
        <button className="os-enter" onClick={onEnter}>
          {t.clickToEnter}
          <ArrowRight size={17} />
        </button>
      </motion.div>
    </motion.div>
  );
}
