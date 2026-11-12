"use client";
import { motion } from "motion/react";
import { appById, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import type { Words } from "./i18n";

export function Switcher({ order, index, t }: { order: AppId[]; index: number; t: Words }) {
  return (
    <motion.div
      className="os-switcher"
      role="listbox"
      aria-label={t.window}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12 }}
    >
      {order.map((id, i) => (
        <div key={id} role="option" aria-selected={i === index} className={i === index ? "is-sel" : ""}>
          <AppIcon src={appById[id].src} size={64} />
          <span>{t[id]}</span>
        </div>
      ))}
    </motion.div>
  );
}
