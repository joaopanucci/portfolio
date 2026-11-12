"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { projectIcons } from "../apps";
import { AppIcon } from "../AppIcon";
import { projects } from "../catalog";
import { drawScene, sceneFor, type Focus } from "../scenes";
import { cosmicDate, eras } from "../timeline";
import type { AppProps } from "./types";

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

function shortAgo(id: string, ago: number, today: string) {
  if (id === "big-bang") return "t = 0";
  if (id === "nuclei") return "3 min";
  if (ago === 0) return today;
  const f = (n: number) => n.toLocaleString("en", { maximumFractionDigits: 1 });
  if (ago >= 1e9) return `${f(ago / 1e9)} Ga`;
  if (ago >= 1e6) return `${f(ago / 1e6)} Ma`;
  if (ago >= 1e3) return `${f(ago / 1e3)} ka`;
  return `${f(ago)} a`;
}

export function CosmosApp({ t, language, arg, openApp, reduced }: AppProps) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seen, setSeen] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ kind: sceneFor[eras[0].id], prev: sceneFor[eras[0].id], since: 0, tint: rgb(eras[0].colors[1]) });

  // deep link from Spotlight / constellation: adjust during render rather than in an effect
  if (arg && arg.nonce !== seen) {
    setSeen(arg.nonce);
    const i = eras.findIndex((e) => e.id === arg.value);
    if (i >= 0) setActive(i);
  }

  const era = eras[active];
  const copy = era.text[language];
  const cal = cosmicDate(era.ago, language);
  const go = (i: number) => setActive(Math.max(0, Math.min(eras.length - 1, i)));

  // scene bookkeeping for crossfades
  useEffect(() => {
    const s = state.current;
    s.prev = s.kind;
    s.kind = sceneFor[era.id];
    s.since = performance.now();
    s.tint = rgb(era.colors[1]);
  }, [era]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % eras.length), 7500);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const el = canvas.current;
    const box = root.current;
    const ctx = el?.getContext("2d");
    if (!el || !box || !ctx) return;
    let w = 0, h = 0, raf = 0;
    const focus = (): Focus =>
      w >= 640
        ? { x: w * 0.68, y: h * 0.4, r: Math.min(w * 0.25, h * 0.3) }
        : { x: w * 0.5, y: h * 0.27, r: Math.min(w * 0.28, h * 0.19) };
    const paint = (now: number) => {
      const s = state.current;
      const f = focus();
      const k = reduced ? 1 : Math.min(1, (now - s.since) / 700);
      if (k < 1 && s.prev !== s.kind) {
        drawScene(s.prev, ctx, w, h, now, f, s.tint);
        ctx.globalAlpha = k;
        drawScene(s.kind, ctx, w, h, now, f, s.tint);
        ctx.globalAlpha = 1;
      } else drawScene(s.kind, ctx, w, h, reduced ? 5000 : now, f, s.tint);
    };
    const loop = (now: number) => {
      paint(now);
      raf = requestAnimationFrame(loop);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = box.clientWidth;
      h = box.clientHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    resize();
    if (!reduced) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reduced, active]);

  const wheel = useRef(0);
  return (
    <div
      ref={root}
      className="os-c2"
      tabIndex={0}
      aria-label={t.cosmosTitle}
      style={{ "--c1": era.colors[0], "--c2": era.colors[1] } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") go(active + 1);
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(active - 1);
      }}
      onWheel={(e) => {
        const now = Date.now();
        if (now - wheel.current < 650 || Math.abs(e.deltaY) < 12) return;
        wheel.current = now;
        go(active + (e.deltaY > 0 ? 1 : -1));
      }}
    >
      <canvas ref={canvas} className="os-c2-stage" aria-hidden />
      <div className="os-c2-shade" aria-hidden />

      <header className="os-c2-top">
        <span className="os-c2-eyebrow">
          {t.cosmosTitle} · {String(active + 1).padStart(2, "0")}/{eras.length}
        </span>
        <span className="os-c2-cal" title={t.cosmicYear}>
          <i>
            <b style={{ left: `${cal.progress * 100}%` }} />
          </i>
          {cal.date} · {cal.time}
        </span>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={era.id}
          className="os-c2-copy"
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <p className="os-c2-when">{copy.when}</p>
          <h2>{copy.title}</h2>
          <p className="os-c2-body">{copy.body}</p>
          {era.id === "now" && (
            <div className="os-c2-projects">
              {projects.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  onClick={() => openApp("projects", p.id)}
                >
                  <AppIcon src={projectIcons[p.icon]} size={34} />
                  {p.title}
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <footer className="os-c2-track">
        <div className="os-c2-controls">
          <button aria-label="‹" onClick={() => go(active - 1)} disabled={active === 0}>
            <CaretLeft weight="bold" />
          </button>
          <button aria-label={playing ? t.labPause : t.labPlay} aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
          </button>
          <button aria-label="›" onClick={() => go(active + 1)} disabled={active === eras.length - 1}>
            <CaretRight weight="bold" />
          </button>
        </div>
        <ol className="os-c2-strip" style={{ "--fill": `${(active / (eras.length - 1)) * 100}%` } as React.CSSProperties}>
          {eras.map((e, i) => (
            <li key={e.id}>
              <button
                className={i === active ? "is-on" : i < active ? "is-past" : ""}
                aria-label={`${e.text[language].title} — ${e.text[language].when}`}
                aria-current={i === active}
                onClick={() => go(i)}
              >
                <i />
                <span>{shortAgo(e.id, e.ago, t.today)}</span>
              </button>
            </li>
          ))}
        </ol>
      </footer>
    </div>
  );
}
