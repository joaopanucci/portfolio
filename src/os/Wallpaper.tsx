"use client";
import { useEffect, useRef } from "react";
import { along, buildArt, type Art, type Path } from "./neuralArt";
import type { Preferences } from "./preferences";

const TAU = Math.PI * 2;
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const hex2 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");

/* ───────── faint star dust ───────── */
type Star = { x: number; y: number; z: number; phase: number; speed: number };
function makeStars(): Star[] {
  const r = rng(11);
  return Array.from({ length: 140 }, () => ({ x: r(), y: r(), z: Math.pow(r(), 2.4), phase: r() * TAU, speed: 0.4 + r() * 1.6 }));
}

function glyph(ch: string, color: string, size: number, dpr: number) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(size * dpr);
  const x = c.getContext("2d")!;
  x.scale(dpr, dpr);
  x.fillStyle = color;
  x.font = `600 ${size * 0.92}px ui-monospace, "SF Mono", Menlo, monospace`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(ch, size / 2, size / 2 + size * 0.04);
  return c;
}

/** Draws every line of the artwork once; the animated layer is composited on top each frame. */
function renderStatic(art: Art, w: number, h: number, dpr: number, tint: string) {
  const c = document.createElement("canvas");
  c.width = w * dpr;
  c.height = h * dpr;
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  g.lineCap = "round";
  g.lineJoin = "round";
  const lw = Math.max(1.3, art.S * 0.0026);
  const poly = (pts: [number, number][], close = false) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (close) g.closePath();
  };

  // spider web
  g.strokeStyle = `${tint}${hex2(0.11)}`;
  g.lineWidth = 1;
  art.web.spokes.forEach((s) => {
    poly(s);
    g.stroke();
  });
  art.web.rings.forEach((r, i) => {
    g.strokeStyle = `${tint}${hex2(0.16 - Math.min(0.1, i * 0.012))}`;
    poly(r);
    g.stroke();
  });
  g.fillStyle = `${tint}${hex2(0.3)}`;
  art.web.nodes.forEach(([x, y]) => {
    g.beginPath();
    g.arc(x, y, 1.5, 0, TAU);
    g.fill();
  });

  // glowing line work
  g.shadowColor = tint;
  g.shadowBlur = 10;
  g.strokeStyle = tint;
  g.lineWidth = lw;
  poly(art.rightOutline);
  g.stroke();
  poly(art.leftOutline);
  g.stroke();
  g.beginPath();
  g.moveTo(art.midX, art.rightOutline[0][1]);
  g.lineTo(art.midX, art.rightOutline[art.rightOutline.length - 1][1]);
  g.stroke();
  g.lineWidth = lw * 0.85;
  art.folds.forEach((f) => {
    poly(f);
    g.stroke();
  });
  g.lineWidth = lw * 0.8;
  art.paths
    .filter((p) => p.kind === "trace")
    .forEach((p) => {
      poly(p.pts);
      g.stroke();
    });
  // pads
  g.fillStyle = "#02060d";
  art.pads.forEach(([x, y]) => {
    g.beginPath();
    g.arc(x, y, art.S * 0.0068, 0, TAU);
    g.fill();
    g.stroke();
  });
  // chip
  const { x, y, half } = art.chip;
  g.shadowBlur = 14;
  g.fillStyle = "#03101c";
  g.lineWidth = lw * 1.2;
  g.beginPath();
  g.roundRect(x - half, y - half, half * 2, half * 2, half * 0.12);
  g.fill();
  g.stroke();
  g.lineWidth = lw * 0.9;
  g.fillStyle = tint;
  const pin = (px: number, py: number, pw: number, ph: number) => g.fillRect(px - pw / 2, py - ph / 2, pw, ph);
  for (let i = 0; i < 6; i++) {
    const o = -0.025 * art.S + i * 0.01 * art.S;
    pin(x + o, y - half - half * 0.14, half * 0.1, half * 0.3);
    pin(x + o, y + half + half * 0.14, half * 0.1, half * 0.3);
  }
  for (let i = 0; i < 7; i++) pin(x - half - half * 0.14, y - 0.03 * art.S + i * 0.01 * art.S, half * 0.3, half * 0.1);
  for (let i = 0; i < 3; i++) pin(x + half + half * 0.14, y - 0.01 * art.S + i * 0.01 * art.S, half * 0.3, half * 0.1);
  return c;
}

type Cell = { x: number; y: number; base: number; phase: number; bit: number };
type Packet = { path: Path; d: number; speed: number; dir: 1 | -1; bit: number; flip: number };

function LiveNeural({ reduced, tint, root, locked }: { reduced: boolean; tint: string; root: React.RefObject<HTMLDivElement | null>; locked: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lockedRef = useRef(locked);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const stars = makeStars();
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const rand = rng(Math.floor(Math.random() * 1e6) + 1);
    let w = 0, h = 0, raf = 0;
    let shift = 0;
    let art: Art | null = null;
    let layer: HTMLCanvasElement | null = null;
    let cells: Cell[] = [];
    let cellPx = 10;
    let gpx = 11;
    let sprites: { tint: HTMLCanvasElement[]; white: HTMLCanvasElement[] } | null = null;
    let packets: Packet[] = [];
    const padFlash: number[] = [];
    let chipFlash = -9999;
    let waveStart = 0;

    const spawn = (t0 = 0): Packet => {
      const a = art!;
      const roll = rand();
      const pool = (kinds: Path["kind"][]) => a.paths.filter((p) => kinds.includes(p.kind));
      const list = roll < 0.45 ? pool(["trace"]) : roll < 0.78 ? pool(["web"]) : roll < 0.92 ? pool(["fold"]) : pool(["ring"]);
      const path = list[Math.floor(rand() * list.length)] ?? a.paths[0];
      const dir: 1 | -1 = path.kind === "trace" ? (rand() < 0.5 ? 1 : -1) : path.kind === "web" ? (rand() < 0.7 ? 1 : -1) : 1;
      const base = path.kind === "web" ? 0.0006 : path.kind === "ring" ? 0.0004 : 0.00032;
      return { path, d: t0 ? rand() * path.len : 0, speed: a.S * base * (0.7 + rand() * 0.7), dir, bit: rand() < 0.5 ? 0 : 1, flip: rand() * 200 };
    };

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      art = buildArt(w, h);
      layer = renderStatic(art, w, h, dpr, tint);
      gpx = Math.max(9, art.S * 0.0165);
      cellPx = Math.max(8, art.S * 0.0215);
      sprites = {
        tint: [glyph("0", tint, gpx, dpr), glyph("1", tint, gpx, dpr)],
        white: [glyph("0", "#ffffff", gpx, dpr), glyph("1", "#ffffff", gpx, dpr)],
      };
      // digit fill of the right hemisphere, brighter near the folds
      const foldPts = art.folds.flat();
      cells = [];
      const r = rng(41);
      for (let y = art.box.y0; y < art.box.y1; y += cellPx)
        for (let x = art.box.x0; x < art.box.x1; x += cellPx) {
          const cx = x + cellPx / 2, cy = y + cellPx / 2;
          if (!art.inRight(cx, cy)) continue;
          let near = 1e9;
          for (const p of foldPts) near = Math.min(near, Math.hypot(p[0] - cx, p[1] - cy));
          const base = 0.07 + Math.max(0, 1 - near / (cellPx * 2.6)) * 0.3;
          cells.push({ x: cx, y: cy, base, phase: r() * TAU, bit: r() < 0.5 ? 0 : 1 });
        }
      packets = Array.from({ length: 46 }, () => spawn(1));
    };

    const frame = (t: number) => {
      if (!art || !layer || !sprites) return;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.fillStyle = `rgba(190,215,255,${(0.1 + s.z * 0.4) * tw})`;
        ctx.fillRect(s.x * w + pointer.x * s.z * 16, s.y * h + pointer.y * s.z * 11, 0.5 + s.z * 1.2, 0.5 + s.z * 1.2);
      }

      ctx.save();
      ctx.translate(pointer.x * 9 + shift, pointer.y * 6);

      // soft halo behind the chip
      const { chip, S } = art;
      const halo = ctx.createRadialGradient(chip.x, chip.y, 0, chip.x, chip.y, S * 0.5);
      halo.addColorStop(0, `${tint}${hex2(0.16)}`);
      halo.addColorStop(1, `${tint}00`);
      ctx.fillStyle = halo;
      ctx.fillRect(chip.x - S * 0.5, chip.y - S * 0.5, S, S);

      ctx.drawImage(layer, 0, 0, w, h);

      // a wave leaves the chip every few seconds and lights the binary cortex
      if (t - waveStart > 3600) waveStart = t;
      const waveR = (t - waveStart) * S * 0.00034;
      const tick = Math.floor(t / 180);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const k = (Math.hypot(c.x - chip.x, c.y - chip.y) - waveR) / (S * 0.05);
        const b = Math.exp(-k * k) * Math.max(0, 1 - waveR / (S * 0.6));
        const alpha = Math.min(1, c.base + Math.sin(t * 0.0018 + c.phase) * 0.05 + b * 0.8);
        if (alpha < 0.03) continue;
        const bit = b > 0.2 ? (hash(i, tick) > 0.5 ? 1 : 0) : c.bit;
        ctx.globalAlpha = alpha;
        ctx.drawImage(b > 0.45 ? sprites.white[bit] : sprites.tint[bit], c.x - gpx / 2, c.y - gpx / 2, gpx, gpx);
      }
      ctx.globalAlpha = 1;

      // pads that just received a packet
      art.pads.forEach(([x, y], i) => {
        const age = t - (padFlash[i] ?? -9999);
        if (age > 700) return;
        const k = 1 - age / 700;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, S * 0.03);
        gr.addColorStop(0, `rgba(255,255,255,${k})`);
        gr.addColorStop(0.4, `${tint}${hex2(0.7 * k)}`);
        gr.addColorStop(1, `${tint}00`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(x, y, S * 0.03, 0, TAU);
        ctx.fill();
      });

      // chip core
      const cf = Math.max(0, 1 - (t - chipFlash) / 500);
      const pulse = 0.55 + 0.25 * Math.sin(t * 0.003) + cf * 0.5;
      const core = chip.half * 1.15;
      ctx.fillStyle = `${tint}${hex2(Math.min(1, pulse))}`;
      ctx.shadowColor = tint;
      ctx.shadowBlur = 14 + cf * 16;
      ctx.fillRect(chip.x - core / 2, chip.y - core / 2, core, core);
      ctx.shadowBlur = 0;

      // data packets: binary digits running along traces, web strands and folds
      const dt = reduced ? 0 : 16;
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        p.d += p.speed * dt;
        p.flip -= dt;
        if (p.flip <= 0) {
          p.bit = p.bit ? 0 : 1;
          p.flip = 160 + rand() * 260;
        }
        if (p.d >= p.path.len) {
          if (p.path.kind === "trace") {
            if (p.dir > 0) padFlash[p.path.pad] = t;
            else chipFlash = t;
          }
          packets[i] = spawn();
          continue;
        }
        for (let k = 0; k < 6; k++) {
          const dd = p.d - k * gpx * 0.85;
          if (dd < 0) break;
          const [x, y] = along(p.path, p.dir > 0 ? dd : p.path.len - dd);
          ctx.globalAlpha = k === 0 ? 1 : Math.max(0, 0.7 - k * 0.13);
          ctx.drawImage(k === 0 ? sprites.white[p.bit] : sprites.tint[p.bit], x - gpx / 2, y - gpx / 2, gpx, gpx);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    const loop = (t: number) => {
      const goal = lockedRef.current ? (w >= 900 ? w * 0.2 : 0) : w >= 1100 ? -w * 0.045 : 0;
      shift += (goal - shift) * 0.06;
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;
      root.current?.style.setProperty("--px", pointer.x.toFixed(3));
      root.current?.style.setProperty("--py", pointer.y.toFixed(3));
      frame(t);
      raf = requestAnimationFrame(loop);
    };
    const still = () => {
      shift = lockedRef.current ? (w >= 900 ? w * 0.2 : 0) : w >= 1100 ? -w * 0.045 : 0;
      waveStart = 0;
      frame(900);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    const onResize = () => {
      setup();
      if (reduced) still();
    };
    setup();
    if (reduced) still();
    else {
      raf = requestAnimationFrame(loop);
      window.addEventListener("pointermove", onMove);
      document.addEventListener("visibilitychange", onVisibility);
    }
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, tint, root]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function Wallpaper({
  reduced,
  accent,
  locked,
}: {
  reduced: boolean;
  accent: Preferences["accent"];
  locked: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const tint = { cyan: "#22b8ff", violet: "#a78bfa", amber: "#fbbf24" }[accent];
  return (
    <div ref={root} className={`os-wallpaper ${locked ? "is-locked" : ""} ${reduced ? "is-still" : ""}`} aria-hidden>
      <div className="os-void" />
      <LiveNeural reduced={reduced} tint={tint} root={root} locked={locked} />
      <div className="absolute inset-0 os-vignette" />
    </div>
  );
}
