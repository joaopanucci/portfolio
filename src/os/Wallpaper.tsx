"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Preferences } from "./preferences";

type Star = { x: number; y: number; z: number; phase: number; speed: number };
type Planet = { orbit: number; angle: number; speed: number; size: number; color: string };

const PLANETS: Planet[] = [
  { orbit: 0.16, angle: 0.5, speed: 0.22, size: 3, color: "#fbbf24" },
  { orbit: 0.26, angle: 2.6, speed: 0.15, size: 4.5, color: "#60a5fa" },
  { orbit: 0.38, angle: 4.2, speed: 0.1, size: 3.5, color: "#fb923c" },
  { orbit: 0.54, angle: 1.3, speed: 0.065, size: 7, color: "#e7c9a0" },
  { orbit: 0.74, angle: 5.1, speed: 0.04, size: 5.5, color: "#67e8f9" },
];

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  stars: Star[],
  pointer: { x: number; y: number },
  shooting: { x: number; y: number; life: number } | null,
  tint: string,
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5 + pointer.x * -14;
  const cy = h * 0.46 + pointer.y * -10;
  const scale = Math.min(w, h * 1.5);

  // star-chart grid lines through the sun
  ctx.strokeStyle = "rgba(255,226,170,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();

  // orbits (tilted ellipses)
  const tilt = 0.4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.28);
  PLANETS.forEach((p, i) => {
    const r = p.orbit * scale;
    ctx.strokeStyle = `rgba(255,220,160,${0.16 - i * 0.015})`;
    ctx.setLineDash(i % 2 ? [2, 7] : []);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * tilt, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // sun rays
  const pulse = 1 + Math.sin(t * 0.0012) * 0.04;
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2 + t * 0.00005;
    const len = (38 + ((i * 37) % 60)) * pulse * (scale / 900);
    ctx.strokeStyle = `rgba(255,170,70,${0.05 + (i % 3) * 0.04})`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26 * tilt * 1.4);
    ctx.lineTo(Math.cos(a) * (26 + len), Math.sin(a) * (26 + len) * tilt * 1.4);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 150 * pulse);
  glow.addColorStop(0, "rgba(255,200,110,0.95)");
  glow.addColorStop(0.12, "rgba(255,140,40,0.55)");
  glow.addColorStop(0.45, "rgba(255,90,20,0.12)");
  glow.addColorStop(1, "rgba(255,90,20,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 150 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  const core = ctx.createRadialGradient(-4, -4, 1, 0, 0, 17);
  core.addColorStop(0, "#fff7d6");
  core.addColorStop(0.5, "#ffb347");
  core.addColorStop(1, "#ea580c");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // planets
  PLANETS.forEach((p) => {
    const a = p.angle + t * 0.001 * p.speed;
    const r = p.orbit * scale;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * tilt;
    const g = ctx.createRadialGradient(px - p.size * 0.3, py - p.size * 0.3, 0, px, py, p.size * 1.6);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.25, p.color);
    g.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // stars with parallax and twinkle
  for (const s of stars) {
    const drift = (t * 0.000004 * (0.3 + s.z)) % 1;
    const sx = (((s.x + drift) % 1) * w + pointer.x * s.z * 22 + w) % w;
    const sy = s.y * h + pointer.y * s.z * 16;
    const tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
    ctx.fillStyle = `rgba(255,255,255,${(0.25 + s.z * 0.65) * tw})`;
    const size = 0.4 + s.z * 1.5;
    ctx.fillRect(sx, sy, size, size);
    if (s.z > 0.92) {
      ctx.fillStyle = `${tint}${Math.round(tw * 90 + 20).toString(16).padStart(2, "0")}`;
      ctx.fillRect(sx - 4, sy + size / 2 - 0.3, 9, 0.7);
      ctx.fillRect(sx + size / 2 - 0.3, sy - 4, 0.7, 9);
    }
  }

  if (shooting) {
    const k = shooting.life;
    const x = shooting.x + k * 260;
    const y = shooting.y + k * 120;
    const g = ctx.createLinearGradient(x, y, x - 90, y - 42);
    g.addColorStop(0, `rgba(255,255,255,${1 - k})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 90, y - 42);
    ctx.stroke();
  }
}

function LiveCosmos({ reduced, tint }: { reduced: boolean; tint: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const stars: Star[] = Array.from({ length: 360 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.pow(Math.random(), 2.2),
      phase: Math.random() * 6.28,
      speed: 0.4 + Math.random() * 1.6,
    }));
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let w = 0, h = 0, raf = 0;
    let shooting: { x: number; y: number; life: number } | null = null;
    let nextShot = 3500;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    let last = performance.now();
    const frame = (t: number) => {
      const dt = t - last;
      last = t;
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;
      nextShot -= dt;
      if (!shooting && nextShot <= 0) {
        shooting = { x: Math.random() * w * 0.6, y: Math.random() * h * 0.4, life: 0 };
        nextShot = 5000 + Math.random() * 7000;
      }
      if (shooting) {
        shooting.life += dt / 900;
        if (shooting.life >= 1) shooting = null;
      }
      drawScene(ctx, w, h, t, stars, pointer, shooting, tint);
      raf = requestAnimationFrame(frame);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    resize();
    if (reduced) drawScene(ctx, w, h, 12000, stars, pointer, null, tint);
    else {
      raf = requestAnimationFrame(frame);
      window.addEventListener("pointermove", onMove);
      document.addEventListener("visibilitychange", onVisibility);
    }
    const onResize = () => {
      resize();
      if (reduced) drawScene(ctx, w, h, 12000, stars, pointer, null, tint);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, tint]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function Wallpaper({
  mode,
  reduced,
  accent,
  locked,
}: {
  mode: Preferences["wallpaper"];
  reduced: boolean;
  accent: Preferences["accent"];
  locked: boolean;
}) {
  const [gifFailed, setGifFailed] = useState(false);
  const tint = { cyan: "#67e8f9", violet: "#c4b5fd", amber: "#fcd34d" }[accent];
  const showGif = mode === "gif" && !reduced && !gifFailed;
  return (
    <div className={`os-wallpaper ${locked ? "is-locked" : ""}`} aria-hidden>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/wallpapers/joaoos-nebula.png')" }} />
      {showGif && (
        <Image
          unoptimized
          fill
          sizes="100vw"
          alt=""
          src="/wallpapers/joaoos-nebula-animated.gif"
          onError={() => setGifFailed(true)}
          className="absolute inset-0 object-cover"
        />
      )}
      {mode === "live" && <LiveCosmos reduced={reduced} tint={tint} />}
      <div className="absolute inset-0 os-vignette" />
    </div>
  );
}
