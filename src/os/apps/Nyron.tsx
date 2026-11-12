"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { callJava } from "../java";
import { PLANET_COLORS, STEP, World, predict } from "../engine";
import { javaFiles, tokenize } from "../javaSamples";
import type { AppProps } from "./types";

type Tab = "sim" | "code" | "jvm";

function Simulation({ t, reduced }: Pick<AppProps, "t" | "reduced">) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const [running, setRunning] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [trails, setTrails] = useState(true);
  const [hud, setHud] = useState({ fps: 0, bodies: 0, ticks: 0 });
  const live = useRef({ running, speed, trails });
  const aim = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const colorIndex = useRef(4);

  useEffect(() => {
    live.current = { running, speed, trails };
  }, [running, speed, trails]);

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    const ctx = el?.getContext("2d");
    if (!el || !box || !ctx) return;
    const w = (world.current ??= new World());
    let width = 0, height = 0, raf = 0;
    let last = performance.now();
    let acc = 0, frames = 0, fpsClock = last, flare = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.clientWidth;
      height = box.clientHeight;
      el.width = width * dpr;
      el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(performance.now());
    };
    const scale = () => Math.min(width, height) / 2.35;
    const toWorld = (px: number, py: number) => [(px - width / 2) / scale(), (py - height / 2) / scale()];
    const toScreen = (x: number, y: number) => [width / 2 + x * scale(), height / 2 + y * scale()];

    function render(now: number) {
      ctx!.clearRect(0, 0, width, height);
      const s = scale();
      const cx = width / 2, cy = height / 2;
      // reference rings
      ctx!.strokeStyle = "rgba(255,255,255,0.07)";
      ctx!.lineWidth = 1;
      for (const r of [0.28, 0.46, 0.7, 0.92, 1.4]) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, r * s, 0, Math.PI * 2);
        ctx!.stroke();
      }
      // trails
      if (live.current.trails) {
        for (const b of w.bodies) {
          if (b.fixed || b.trail.length < 4) continue;
          const n = b.trail.length / 2;
          for (let i = 1; i < n; i++) {
            const [x0, y0] = toScreen(b.trail[i * 2 - 2], b.trail[i * 2 - 1]);
            const [x1, y1] = toScreen(b.trail[i * 2], b.trail[i * 2 + 1]);
            ctx!.strokeStyle = b.color;
            ctx!.globalAlpha = (i / n) * 0.7;
            ctx!.lineWidth = 1 + (i / n) * 1.6;
            ctx!.beginPath();
            ctx!.moveTo(x0, y0);
            ctx!.lineTo(x1, y1);
            ctx!.stroke();
          }
          ctx!.globalAlpha = 1;
        }
      }
      // launch preview
      const a = aim.current;
      if (a) {
        const [wx, wy] = toWorld(a.x, a.y);
        const [vx, vy] = launchVelocity(a);
        const path = predict(wx, wy, vx, vy);
        ctx!.setLineDash([3, 6]);
        ctx!.strokeStyle = "rgba(255,255,255,0.6)";
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        path.forEach((_, i) => {
          if (i % 2) return;
          const [px, py] = toScreen(path[i], path[i + 1]);
          if (i === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        });
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(a.cx, a.cy);
        ctx!.strokeStyle = "rgba(255,255,255,0.35)";
        ctx!.stroke();
      }
      // bodies
      for (const b of w.bodies) {
        const [x, y] = toScreen(b.x, b.y);
        const r = b.radius * s;
        if (b.fixed) {
          const pulse = 1 + Math.sin(now * 0.003) * 0.06 + flare;
          const g = ctx!.createRadialGradient(x, y, 0, x, y, r * 5 * pulse);
          g.addColorStop(0, "rgba(255,226,150,0.95)");
          g.addColorStop(0.2, "rgba(255,150,40,0.45)");
          g.addColorStop(1, "rgba(255,90,20,0)");
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(x, y, r * 5 * pulse, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#fff4c4";
          ctx!.beginPath();
          ctx!.arc(x, y, r * 0.9, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          const g = ctx!.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r * 1.8);
          g.addColorStop(0, "#fff");
          g.addColorStop(0.35, b.color);
          g.addColorStop(1, "rgba(0,0,0,0.5)");
          ctx!.shadowColor = b.color;
          ctx!.shadowBlur = 10;
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(x, y, r, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }
    }

    function launchVelocity(a: { x: number; y: number; cx: number; cy: number }) {
      const k = 2.4 / scale();
      return [(a.x - a.cx) * k, (a.y - a.cy) * k];
    }

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      if (live.current.running) {
        acc += dt * live.current.speed * 0.6;
        let guard = 0;
        const before = w.bodies.length;
        while (acc >= STEP && guard++ < 600) {
          w.update(STEP);
          acc -= STEP;
        }
        if (w.bodies.length < before) flare = 0.5;
      }
      flare *= 0.94;
      frames++;
      if (now - fpsClock >= 500) {
        setHud({ fps: Math.round((frames * 1000) / (now - fpsClock)), bodies: w.bodies.length - 1, ticks: w.ticks });
        frames = 0;
        fpsClock = now;
      }
      render(now);
      raf = requestAnimationFrame(frame);
    };

    const down = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      aim.current = { x, y, cx: x, cy: y };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!aim.current) return;
      const r = el.getBoundingClientRect();
      aim.current.cx = e.clientX - r.left;
      aim.current.cy = e.clientY - r.top;
      if (!live.current.running) render(performance.now());
    };
    const up = () => {
      const a = aim.current;
      aim.current = null;
      if (!a) return;
      const [wx, wy] = toWorld(a.x, a.y);
      const color = PLANET_COLORS[colorIndex.current++ % PLANET_COLORS.length];
      if (Math.hypot(a.cx - a.x, a.cy - a.y) < 8) {
        const r = Math.max(0.12, Math.hypot(wx, wy));
        w.launchCircular(r, Math.atan2(wy, wx), 1, color);
      } else {
        const [vx, vy] = launchVelocity(a);
        w.spawn(wx, wy, vx, vy, color);
      }
      render(performance.now());
    };
    const reset = () => {
      w.reset();
      render(performance.now());
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", () => (aim.current = null));
    box.addEventListener("nyron:reset", reset);
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    resize();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      box.removeEventListener("nyron:reset", reset);
    };
  }, []);

  return (
    <div className="os-lab-sim">
      <div className="os-lab-canvas" ref={wrap}>
        <canvas ref={canvas} aria-label={t.labHint} role="img" />
        <div className="os-lab-hud" aria-hidden>
          UPS 120 · FPS {hud.fps}
          <br />
          {t.labBodies} {hud.bodies} · tick {hud.ticks}
        </div>
        <p className="os-lab-hint">{t.labHint}</p>
      </div>
      <div className="os-lab-controls">
        <button className="os-btn" onClick={() => setRunning((r) => !r)} aria-pressed={running}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? t.labPause : t.labPlay}
        </button>
        <button className="os-btn" onClick={() => wrap.current?.dispatchEvent(new Event("nyron:reset"))}>
          <RotateCcw size={14} />
          {t.labReset}
        </button>
        <label className="os-range">
          {t.labSpeed}
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <output>{speed}×</output>
        </label>
        <label className="os-check">
          <input type="checkbox" checked={trails} onChange={(e) => setTrails(e.target.checked)} />
          {t.labTrails}
        </label>
      </div>
    </div>
  );
}

function CodeView({ t }: { t: AppProps["t"] }) {
  const [file, setFile] = useState(0);
  const current = javaFiles[file];
  return (
    <div className="os-code">
      <div className="os-code-tabs" role="tablist">
        {javaFiles.map((f, i) => (
          <button key={f.name} role="tab" aria-selected={file === i} onClick={() => setFile(i)}>
            {f.name}
          </button>
        ))}
      </div>
      <pre tabIndex={0}>
        <code>
          {current.code.split("\n").map((line, i) => (
            <span className="ln" key={i}>
              <i>{i + 1}</i>
              {tokenize(line).map((tok, j) => (
                <span key={j} className={`tk-${tok.kind}`}>
                  {tok.text}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
      <p className="os-code-note">{t.labDisclaimer}</p>
    </div>
  );
}

function JvmView({ t, language }: Pick<AppProps, "t" | "language">) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ lines: string[]; live: boolean } | null>(null);
  async function run() {
    setBusy(true);
    try {
      const r = await callJava("nyron", language);
      setResult({ lines: r.lines, live: r.live });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="os-jvm">
      <p>{t.labJvmIntro}</p>
      <button className="os-btn is-primary" onClick={run} disabled={busy}>
        <Play size={14} />
        {busy ? t.labRunning : t.labRun}
      </button>
      {result && (
        <div className="os-jvm-out">
          <span className={`os-java-pill is-${result.live ? "live" : "demo"}`}>
            <i /> {result.live ? t.javaLive : t.javaDemo}
          </span>
          {!result.live && <p className="os-muted">{t.labJvmOffline}</p>}
          <pre>{result.lines.join("\n")}</pre>
        </div>
      )}
    </div>
  );
}

export function NyronApp({ t, language, reduced }: AppProps) {
  const [tab, setTab] = useState<Tab>("sim");
  const tabs: { id: Tab; label: string }[] = [
    { id: "sim", label: t.labSim },
    { id: "code", label: t.labCode },
    { id: "jvm", label: t.labJvm },
  ];
  return (
    <div className="os-lab">
      <div className="os-seg is-compact" role="tablist">
        {tabs.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? "is-sel" : ""} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="os-lab-body">
        {tab === "sim" && <Simulation t={t} reduced={reduced} />}
        {tab === "code" && <CodeView t={t} />}
        {tab === "jvm" && <JvmView t={t} language={language} />}
      </div>
    </div>
  );
}
