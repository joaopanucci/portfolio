"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { apps, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import type { Words } from "./i18n";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Panel({ t, onClose, onOpen }: { t: Words; onClose: () => void; onOpen: (id: AppId) => void }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const list = apps.filter((a) => norm(t[a.id]).includes(norm(query.trim())));
  return (
    <motion.div
      className="os-launchpad"
      role="dialog"
      aria-label={t.launchpad}
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.28 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && list.length === 1) {
          onOpen(list[0].id);
          onClose();
        }
      }}
    >
      <label className="os-launchpad-search">
        <Search size={15} />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.launchpadSearch}
          aria-label={t.launchpadSearch}
          autoComplete="off"
        />
      </label>
      <div className="os-launchpad-grid" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
        {list.map((app, i) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.04 * i, type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              onOpen(app.id);
              onClose();
            }}
          >
            <AppIcon src={app.src} size={84} />
            <span>{t[app.id]}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export function Launchpad(props: { open: boolean; t: Words; onClose: () => void; onOpen: (id: AppId) => void }) {
  const { open, ...rest } = props;
  return <AnimatePresence>{open && <Panel key="lp" {...rest} />}</AnimatePresence>;
}
