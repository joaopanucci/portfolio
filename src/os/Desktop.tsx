"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BrainCircuit } from "lucide-react";
import { AboutApp } from "./apps/About";
import { ContactApp } from "./apps/Contact";
import { ChessApp } from "./apps/Chess";
import { NyronApp } from "./apps/Nyron";
import { ProjectsApp } from "./apps/Projects";
import { SettingsApp } from "./apps/Settings";
import { TerminalApp } from "./apps/Terminal";
import type { AppProps } from "./apps/types";
import { appById, type AppId } from "./apps";
import { Dock } from "./Dock";
import { Launchpad } from "./Launchpad";
import { Switcher } from "./Switcher";
import { words, type Language } from "./i18n";
import { useJavaStatus } from "./java";
import { MenuBar } from "./MenuBar";
import type { Preferences } from "./preferences";
import { Spotlight } from "./Spotlight";
import { Widgets } from "./Widgets";
import { AppWindow, constrain, snapBox, type SnapZone, type WindowState } from "./Window";

type Toast = { id: number; title: string; body?: string };

function Content({ id, ...props }: AppProps & { id: AppId }) {
  switch (id) {
    case "about":
      return <AboutApp {...props} />;
    case "projects":
      return <ProjectsApp {...props} />;
    case "chess":
      return <ChessApp {...props} />;
    case "nyron":
      return <NyronApp {...props} />;
    case "terminal":
      return <TerminalApp {...props} />;
    case "contact":
      return <ContactApp {...props} />;
    case "settings":
      return <SettingsApp {...props} />;
  }
}

export function Desktop({
  prefs,
  update,
  reduced,
  onLock,
}: {
  prefs: Preferences;
  update: (patch: Partial<Preferences>) => void;
  reduced: boolean;
  onLock: () => void;
}) {
  const t = words[prefs.language];
  const java = useJavaStatus();
  const [bounds, setBounds] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [windows, setWindows] = useState<WindowState[]>(() => [
    constrain(
      { id: "about", x: 110, y: 70, width: 760, height: 520, minimized: false, maximized: false },
      { width: window.innerWidth, height: window.innerHeight },
    ),
  ]);
  const [args, setArgs] = useState<Partial<Record<AppId, { value: string; nonce: number }>>>({});
  const [bouncing, setBouncing] = useState<AppId | null>(null);
  const [spotlight, setSpotlight] = useState(false);
  const [launchpad, setLaunchpad] = useState(false);
  const [switcher, setSwitcher] = useState<number | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [snapZone, setSnapZone] = useState<SnapZone | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([{ id: 0, title: t.welcomeTitle, body: t.welcomeBody }]);
  const nonce = useRef(1);
  const mobile = bounds.width < 640;

  useEffect(() => {
    const measure = () => setBounds({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), []);
  useEffect(() => {
    const timer = window.setTimeout(() => setToasts((all) => all.filter((x) => x.id !== 0)), 5200);
    return () => window.clearTimeout(timer);
  }, []);
  const toast = useCallback(
    (title: string, body?: string) => {
      const id = nonce.current++;
      setToasts((all) => [...all.slice(-2), { id, title, body }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const open = useCallback(
    (id: AppId, arg?: string) => {
      if (arg) setArgs((a) => ({ ...a, [id]: { value: arg, nonce: nonce.current++ } }));
      setWindows((current) => {
        const existing = current.find((w) => w.id === id);
        if (!existing) {
          setBouncing(id);
          window.setTimeout(() => setBouncing((b) => (b === id ? null : b)), 1000);
        }
        const [width, height] = appById[id].size;
        const item = existing
          ? { ...existing, minimized: false }
          : constrain(
              {
                id,
                x: 120 + (current.length % 6) * 34,
                y: 64 + (current.length % 6) * 30,
                width,
                height,
                minimized: false,
                maximized: false,
              },
              { width: window.innerWidth, height: window.innerHeight },
            );
        return [...current.filter((w) => w.id !== id), item];
      });
    },
    [],
  );

  const focus = (id: AppId) =>
    setWindows((current) => {
      if (current.at(-1)?.id === id) return current;
      const item = current.find((w) => w.id === id);
      return item ? [...current.filter((w) => w.id !== id), item] : current;
    });
  const patch = (id: AppId, value: Partial<WindowState>) =>
    setWindows((current) => current.map((w) => (w.id === id ? { ...w, ...value } : w)));
  const close = (id: AppId) => setWindows((current) => current.filter((w) => w.id !== id));

  const visible = windows.filter((w) => !w.minimized);
  const active = visible.at(-1)?.id ?? null;

  const switchOrder = [...windows].reverse().map((w) => w.id);
  const orderRef = useRef(switchOrder);
  useEffect(() => {
    orderRef.current = switchOrder;
  });
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Backquote") {
        e.preventDefault();
        const n = orderRef.current.length;
        if (n < 2) return;
        setSwitcher((s) => (s === null ? 1 : (s + (e.shiftKey ? -1 : 1) + n) % n));
      } else if (e.key === "Escape") setSwitcher(null);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return;
      setSwitcher((s) => {
        if (s !== null && orderRef.current[s]) {
          const id = orderRef.current[s];
          queueMicrotask(() => open(id));
        }
        return null;
      });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [open]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpotlight((s) => !s);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const appProps = (id: AppId): AppProps & { id: AppId } => ({
    id,
    t,
    language: prefs.language,
    prefs,
    update,
    arg: args[id],
    openApp: open,
    toast,
    reduced,
  });

  return (
    <motion.div
      className="os-desktop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest(".os-window, .os-dock-wrap, .os-menubar, .os-widgets, .os-spot")) return;
        e.preventDefault();
        setCtx({ x: Math.min(e.clientX, bounds.width - 240), y: Math.min(e.clientY, bounds.height - 330) });
      }}
      onPointerDown={(e) => {
        if (ctx && !(e.target as HTMLElement).closest(".os-ctx")) setCtx(null);
      }}
    >
      <MenuBar
        t={t}
        language={prefs.language}
        activeApp={active}
        openApps={windows.map((w) => w.id)}
        java={java}
        onLanguage={(language: Language) => update({ language })}
        onOpen={open}
        onLock={onLock}
        onSpotlight={() => setSpotlight(true)}
        onFocusApp={open}
        onWindowAction={(action) => {
          if (action === "closeAll") return setWindows([]);
          if (!active) return;
          if (action === "close") close(active);
          else if (action === "minimize") patch(active, { minimized: true });
          else patch(active, { maximized: !windows.find((w) => w.id === active)?.maximized });
        }}
      />

      {!mobile && bounds.width >= 1100 && <Widgets t={t} java={java} onOpen={open} />}

      <AnimatePresence>
        {windows.map((w, index) => (
          <AppWindow
            key={w.id}
            state={w}
            zIndex={index + 10}
            active={active === w.id}
            bounds={bounds}
            t={t}
            focus={() => focus(w.id)}
            update={(value) => patch(w.id, value)}
            close={() => close(w.id)}
            onSnapPreview={setSnapZone}
          >
            <Content {...appProps(w.id)} />
          </AppWindow>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {snapZone && (
          <motion.div
            key={snapZone}
            className="os-snap"
            initial={{ opacity: 0, scale: 0.96, ...snapBox(snapZone, bounds) }}
            animate={{ opacity: 1, scale: 1, ...snapBox(snapZone, bounds) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

      <Dock
        t={t}
        running={new Set(windows.map((w) => w.id))}
        minimized={new Set(windows.filter((w) => w.minimized).map((w) => w.id))}
        bouncing={bouncing}
        magnify={prefs.magnify}
        compact={bounds.width < 480}
        onOpen={open}
        onLaunchpad={() => setLaunchpad(true)}
      />

      <Launchpad open={launchpad} t={t} onClose={() => setLaunchpad(false)} onOpen={open} />
      <AnimatePresence>
        {switcher !== null && <Switcher order={switchOrder} index={switcher} t={t} />}
      </AnimatePresence>

      <AnimatePresence>
        {ctx && (
          <motion.div
            key="ctx"
            className="os-dropdown os-ctx"
            role="menu"
            style={{ left: ctx.x, top: ctx.y, position: "fixed", zIndex: 3800 }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {(["about", "projects", "chess", "nyron", "terminal"] as AppId[]).map((id) => (
              <button
                key={id}
                role="menuitem"
                onClick={() => {
                  setCtx(null);
                  open(id);
                }}
              >
                {t[id]}
              </button>
            ))}
            <hr />
            <button
              role="menuitem"
              onClick={() => {
                setCtx(null);
                const order = ["cyan", "violet", "amber"] as const;
                update({ accent: order[(order.indexOf(prefs.accent) + 1) % order.length] });
              }}
            >
              {t.changeAccent}
            </button>
            <button role="menuitem" onClick={() => { setCtx(null); open("settings"); }}>
              {t.settings}
            </button>
            <button role="menuitem" onClick={() => { setCtx(null); setSpotlight(true); }}>
              {t.openSpotlight}
            </button>
            <hr />
            <button role="menuitem" onClick={onLock}>
              {t.lock}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Spotlight open={spotlight} t={t} onClose={() => setSpotlight(false)} onOpen={open} />

      <div className="os-toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              className="os-toast"
              initial={{ opacity: 0, x: 80, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={() => dismiss(item.id)}
            >
              <span className="os-toast-ico">
                <BrainCircuit size={18} />
              </span>
              <div>
                <b>{item.title}</b>
                {item.body && <p>{item.body}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
