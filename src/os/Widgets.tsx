"use client";
import { motion } from "motion/react";
import type { AppId } from "./apps";
import type { Words } from "./i18n";
import type { JavaState } from "./java";

const item = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0 },
};

/** A tiny board with a knight that hops between squares. */
function MiniBoard() {
  return (
    <div className="os-mini-board" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} className={(Math.floor(i / 6) + (i % 6)) % 2 ? "d" : "l"} />
      ))}
      <span>♞&#xFE0E;</span>
    </div>
  );
}

export function Widgets({
  t,
  java,
  onOpen,
}: {
  t: Words;
  java: JavaState;
  onOpen: (id: AppId) => void;
}) {
  return (
    <motion.aside
      className="os-widgets"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.12, delayChildren: 0.4 }}
      aria-label="Widgets"
    >
      <motion.button variants={item} className="os-widget os-widget-chess" onClick={() => onOpen("chess")}>
        <MiniBoard />
        <div>
          <h3>{t.widgetChess}</h3>
          <p>{t.widgetChessBody}</p>
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
