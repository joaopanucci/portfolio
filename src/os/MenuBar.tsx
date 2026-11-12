"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BatteryFull, Search, Sparkles, Wifi } from "lucide-react";
import type { AppId } from "./apps";
import { languageLabel, languages, locales, type Language, type Words } from "./i18n";
import type { JavaState } from "./java";

type Item =
  | { label: string; onSelect: () => void; hint?: string; disabled?: boolean }
  | "separator";

function Dropdown({ items, onClose }: { items: Item[]; onClose: () => void }) {
  return (
    <motion.div
      className="os-dropdown"
      role="menu"
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.14 }}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <hr key={i} />
        ) : (
          <button
            key={i}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            <span>{item.label}</span>
            {item.hint && <kbd>{item.hint}</kbd>}
          </button>
        ),
      )}
    </motion.div>
  );
}

export function MenuBar({
  t,
  language,
  activeApp,
  openApps,
  java,
  onLanguage,
  onOpen,
  onLock,
  onSpotlight,
  onWindowAction,
  onFocusApp,
}: {
  t: Words;
  language: Language;
  activeApp: AppId | null;
  openApps: AppId[];
  java: JavaState;
  onLanguage: (l: Language) => void;
  onOpen: (id: AppId) => void;
  onLock: () => void;
  onSpotlight: () => void;
  onWindowAction: (action: "minimize" | "zoom" | "close" | "closeAll") => void;
  onFocusApp: (id: AppId) => void;
}) {
  const [menu, setMenu] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (!(e.target as HTMLElement).closest("[data-menu]")) setMenu(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);

  const menus: { id: string; label: ReactNode; bold?: boolean; items?: Item[] }[] = [
    {
      id: "logo",
      label: <Sparkles size={15} aria-label={t.osName} />,
      items: [
        { label: t.aboutOS, onSelect: () => onOpen("about") },
        "separator",
        { label: `${t.settings}…`, onSelect: () => onOpen("settings") },
        "separator",
        { label: t.lock, onSelect: onLock },
      ],
    },
    { id: "app", label: activeApp ? t[activeApp] : t.osName, bold: true },
    {
      id: "window",
      label: t.window,
      items: [
        { label: t.minimize, onSelect: () => onWindowAction("minimize"), disabled: !activeApp },
        { label: t.maximize, onSelect: () => onWindowAction("zoom"), disabled: !activeApp },
        { label: t.close, onSelect: () => onWindowAction("close"), disabled: !activeApp },
        "separator",
        ...(openApps.length
          ? openApps.map((id): Item => ({ label: t[id], onSelect: () => onFocusApp(id) }))
          : [{ label: t.noWindows, onSelect: () => {}, disabled: true } as Item]),
        "separator",
        { label: t.closeAll, onSelect: () => onWindowAction("closeAll"), disabled: !openApps.length },
      ],
    },
    {
      id: "help",
      label: t.help,
      items: [
        { label: t.openSpotlight, onSelect: onSpotlight, hint: "⌘K" },
        { label: t.sourceCode, onSelect: () => window.open("https://github.com/joaopanucci/portfolio", "_blank", "noopener") },
      ],
    },
  ];

  const clock = new Intl.DateTimeFormat(locales[language], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return (
    <header className="os-menubar" data-menu>
      <div className="os-menubar-left">
        {menus.map((m) => (
          <div key={m.id} className="relative" data-menu>
            <button
              className={`os-menu-btn ${m.bold ? "is-bold" : ""} ${menu === m.id ? "is-open" : ""}`}
              disabled={!m.items}
              aria-haspopup={m.items ? "menu" : undefined}
              aria-expanded={m.items ? menu === m.id : undefined}
              onClick={() => m.items && setMenu(menu === m.id ? null : m.id)}
              onPointerEnter={() => menu && m.items && setMenu(m.id)}
            >
              {m.label}
            </button>
            <AnimatePresence>
              {menu === m.id && m.items && <Dropdown items={m.items} onClose={() => setMenu(null)} />}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="os-menubar-right">
        <span
          className={`os-java-pill is-${java}`}
          title={java === "live" ? t.javaLive : java === "demo" ? t.javaDemo : t.javaChecking}
        >
          <i /> Java
        </span>
        <div className="os-lang" role="group" aria-label={t.language}>
          {languages.map((l) => (
            <button key={l} aria-pressed={language === l} onClick={() => onLanguage(l)}>
              {languageLabel[l]}
            </button>
          ))}
        </div>
        <Wifi size={15} aria-hidden className="os-menu-ico" />
        <BatteryFull size={17} aria-hidden className="os-menu-ico" />
        <button className="os-menu-btn" aria-label={t.openSpotlight} onClick={onSpotlight}>
          <Search size={14} />
        </button>
        <time dateTime={now.toISOString()} className="os-clock">
          {clock}
        </time>
      </div>
    </header>
  );
}

