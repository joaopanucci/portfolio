"use client";
import { motion } from "motion/react";
import type { AppId } from "./apps";
import { locales, type Language, type Words } from "./i18n";
import type { JavaState } from "./java";
import { cosmicSeconds } from "./timeline";

const item = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0 },
};

export function Widgets({
  t,
  language,
  java,
  onOpen,
}: {
  t: Words;
  language: Language;
  java: JavaState;
  onOpen: (id: AppId) => void;
}) {
  const seconds = cosmicSeconds(80);
  const circumference = 2 * Math.PI * 34;
  return (
    <motion.aside
      className="os-widgets"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.12, delayChildren: 0.4 }}
      aria-label="Widgets"
    >
      <motion.button
        variants={item}
        className="os-widget os-widget-calendar"
        onClick={() => onOpen("cosmos")}
      >
        <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden>
          <circle cx="40" cy="40" r="34" className="ring-bg" />
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            className="ring"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * 0.003 }}
            transition={{ duration: 2.4, delay: 0.8, ease: "easeOut" }}
          />
          <text x="40" y="45" textAnchor="middle">
            13,8
          </text>
        </svg>
        <div>
          <h3>{t.widgetCalendar}</h3>
          <p>
            {t.widgetCalendarBody}{" "}
            <b>
              {seconds.toLocaleString(locales[language], { maximumFractionDigits: 2 })}{" "}
              {t.widgetCalendarUnit}
            </b>
            .
          </p>
        </div>
      </motion.button>

      <motion.button variants={item} className="os-widget os-widget-nyron" onClick={() => onOpen("nyron")}>
        <div className="os-mini-orbit" aria-hidden>
          <i className="sun" />
          <i className="o o1">
            <b />
          </i>
          <i className="o o2">
            <b />
          </i>
          <i className="o o3">
            <b />
          </i>
        </div>
        <div>
          <h3>{t.widgetNyron}</h3>
          <p>{t.widgetNyronBody}</p>
        </div>
      </motion.button>

      <motion.button variants={item} className="os-widget os-widget-java" onClick={() => onOpen("terminal")}>
        <span className={`os-java-badge is-${java}`}>
          <i />
        </span>
        <div>
          <h3>{t.widgetJava}</h3>
          <p>{java === "live" ? t.javaLive : java === "demo" ? t.javaDemo : t.javaChecking}</p>
        </div>
        <code>$ java --version</code>
      </motion.button>
    </motion.aside>
  );
}
