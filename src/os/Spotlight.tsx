"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { apps, projectIcons, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { projects } from "./catalog";
import type { Words } from "./i18n";

type Result = {
  key: string;
  title: string;
  sub: string;
  kind: string;
  icon: React.ReactNode;
  run: () => void;
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function SpotlightPanel({
  t,
  onClose,
  onOpen,
}: {
  t: Words;
  onClose: () => void;
  onOpen: (id: AppId, arg?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const results = useMemo<Result[]>(() => {
    const all: Result[] = [
      ...apps.map((a) => ({
        key: `app-${a.id}`,
        title: t[a.id],
        sub: "",
        kind: t.kindApp,
        icon: <AppIcon src={a.src} size={30} />,
        run: () => onOpen(a.id),
      })),
      ...projects.map((p) => {
        return {
          key: `project-${p.id}`,
          title: p.title,
          sub: t[p.descKey],
          kind: t.kindProject,
          icon: <AppIcon src={projectIcons[p.icon]} size={30} />,
          run: () => onOpen("projects", p.id),
        };
      }),
    ];
    const q = norm(query.trim());
    if (!q) return all.slice(0, 8);
    return all.filter((r) => norm(`${r.title} ${r.sub} ${r.kind}`).includes(q)).slice(0, 9);
  }, [query, t, onOpen]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && results[index]) {
      results[index].run();
      onClose();
    }
  }

  return (
        <motion.div
          className="os-spot-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="os-spot"
            role="dialog"
            aria-label={t.openSpotlight}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onKeyDown={onKey}
          >
            <label className="os-spot-input">
              <Search size={20} />
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
                }}
                placeholder={t.spotlightPlaceholder}
                aria-label={t.spotlightPlaceholder}
                spellCheck={false}
                autoComplete="off"
              />
            </label>
            <ul role="listbox">
              {results.map((r, i) => (
                <li key={r.key} role="option" aria-selected={i === index}>
                  <button
                    className={i === index ? "is-sel" : ""}
                    onPointerEnter={() => setIndex(i)}
                    onClick={() => {
                      r.run();
                      onClose();
                    }}
                  >
                    {r.icon}
                    <span className="os-spot-text">
                      <b>{r.title}</b>
                      {r.sub && <small>{r.sub}</small>}
                    </span>
                    <em>{r.kind}</em>
                  </button>
                </li>
              ))}
              {!results.length && <li className="os-spot-empty">{t.spotlightEmpty}</li>}
            </ul>
          </motion.div>
        </motion.div>
  );
}

export function Spotlight(props: {
  open: boolean;
  t: Words;
  onClose: () => void;
  onOpen: (id: AppId, arg?: string) => void;
}) {
  const { open, ...rest } = props;
  return <AnimatePresence>{open && <SpotlightPanel key="spot" {...rest} />}</AnimatePresence>;
}
