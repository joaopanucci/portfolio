"use client";
import { useEffect, useRef } from "react";
import { Globe, texture } from "./globe";
import { renderNebula } from "./nebula";
import type { Preferences } from "./preferences";

type Star = { x: number; y: number; z: number; phase: number; speed: number; tint: number };
type Planet = { name: string; tex: string; rot: number; orbit: number; angle: number; speed: number; size: number; color: string; ring?: boolean; moon?: boolean };
type Rock = { r: number; a: number; s: number; size: number };

const TINTS = ["255,255,255", "190,215,255", "255,230,190", "255,200,170"];
const PLANETS: Planet[] = [
  { name: "MERCURIUS", tex: "mercury", rot: 0.6, orbit: 0.15, angle: 0.5, speed: 0.22, size: 4.5, color: "#c9b79c" },
  { name: "VENUS", tex: "venus", rot: 1.4, orbit: 0.23, angle: 2.6, speed: 0.15, size: 6.5, color: "#f1c98a" },
  { name: "TERRA", tex: "earth", rot: Math.PI, orbit: 0.33, angle: 4.2, speed: 0.1, size: 7, color: "#5da9ff", moon: true },
  { name: "MARS", tex: "mars", rot: 0.2, orbit: 0.42, angle: 1.0, speed: 0.08, size: 5.5, color: "#e0713f" },
  { name: "IUPPITER", tex: "jupiter", rot: 1.0, orbit: 0.62, angle: 5.1, speed: 0.045, size: 12, color: "#e3b98a" },
  { name: "SATURNUS", tex: "saturn", rot: 2.0, orbit: 0.8, angle: 3.2, speed: 0.032, size: 10, color: "#ead7a6", ring: true },
];
const sprites = new Map<string, HTMLCanvasElement>();
let spriteGlobe: Globe | null = null;
/** A lit photo-sphere per planet, rendered once when its texture arrives. */
function spriteFor(p: Planet): HTMLCanvasElement | null {
  const hit = sprites.get(p.tex);
  if (hit) return hit;
  const tex = texture(p.tex);
  if (!tex || typeof document === "undefined") return null;
  spriteGlobe ??= new Globe();
  const D = 96;
  const out = document.createElement("canvas");
  out.width = out.height = D;
  out.getContext("2d")!.drawImage(spriteGlobe.render(D, tex, { rotation: p.rot, light: [-0.35, -0.35, 0.87], ambient: 0.25 }), 0, 0);
  sprites.set(p.tex, out);
  return out;
}

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TAU = Math.PI * 2;

function makeStars(): Star[] {
  const r = rng(11);
  return Array.from({ length: 420 }, () => ({
    x: r(),
    y: r(),
    z: Math.pow(r(), 2.4),
    phase: r() * TAU,
    speed: 0.4 + r() * 1.6,
    tint: Math.floor(r() * r() * 4),
  }));
}
const ROCKS: Rock[] = (() => {
  const r = rng(5);
  return Array.from({ length: 220 }, () => ({ r: 0.495 + (r() - 0.5) * 0.06, a: r() * TAU, s: 0.04 + r() * 0.02, size: 0.5 + r() * 0.9 }));
})();
type Dust = { r: number; a: number; size: number; hue: number };
/** Two-arm logarithmic spiral with a bulge and a faint disk, seeded so it is stable between renders. */
const GALAXY: Dust[] = (() => {
  const r = rng(7);
  return Array.from({ length: 1500 }, (_, i) => {
    const kind = r();
    if (kind < 0.22) {
      const d = Math.pow(r(), 1.6) * 0.3;
      return { r: d, a: r() * TAU, size: 0.5 + r() * 0.8, hue: d };
    }
    if (kind < 0.34) {
      const d = Math.pow(r(), 0.8);
      return { r: d, a: r() * TAU, size: 0.4 + r() * 0.5, hue: d };
    }
    const d = 0.1 + Math.pow(r(), 0.8) * 0.9;
    const scatter = (r() - 0.5) * 0.5 * (1.15 - d * 0.6);
    return { r: d, a: Math.log(1 + d * 7) * 2.1 + (i % 2 ? Math.PI : 0) + scatter, size: 0.5 + r() * 1.1, hue: d };
  });
})();

function drawGalaxy(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const R = Math.min(w, h) * 0.13;
  ctx.save();
  ctx.translate(w * 0.86, h * 0.78);
  ctx.rotate(-0.5);
  ctx.scale(1, 0.5);
  ctx.globalCompositeOperation = "lighter";
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
  core.addColorStop(0, "rgba(255,232,190,0.55)");
  core.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.42, 0, TAU);
  ctx.fill();
  const spin = t * 0.00003;
  for (const d of GALAXY) {
    const a = d.a + spin * (1.3 - d.r);
    ctx.fillStyle = `rgba(${Math.round(255 - d.hue * 120)},${Math.round(220 - d.hue * 50)},${Math.round(190 + d.hue * 65)},${0.62 - d.hue * 0.35})`;
    ctx.fillRect(Math.cos(a) * d.r * R, Math.sin(a) * d.r * R, d.size, d.size);
  }
  ctx.restore();
}

type Comet = { x: number; y: number; vx: number; vy: number; life: number };

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  stars: Star[],
  pointer: { x: number; y: number },
  shooting: { x: number; y: number; life: number } | null,
  comet: Comet | null,
  tint: string,
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5 + pointer.x * -16;
  const cy = h * 0.47 + pointer.y * -11;
  const scale = Math.min(w, h * 1.55);
  const tilt = 0.4;
  const rot = -0.28;

  // faint star-chart grid and constellation lines
  ctx.strokeStyle = "rgba(255,226,170,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();

  const bright = stars.filter((s) => s.z > 0.78);
  ctx.strokeStyle = "rgba(170,200,255,0.11)";
  ctx.beginPath();
  for (let i = 0; i < bright.length - 1; i += 3) {
    const a = bright[i], b = bright[i + 1];
    if (Math.hypot((a.x - b.x) * w, (a.y - b.y) * h) < 240) {
      ctx.moveTo(a.x * w + pointer.x * a.z * 22, a.y * h + pointer.y * a.z * 16);
      ctx.lineTo(b.x * w + pointer.x * b.z * 22, b.y * h + pointer.y * b.z * 16);
    }
  }
  ctx.stroke();

  drawGalaxy(ctx, w, h, t);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // degree ring around the system, like a printed star atlas
  const ringR = 0.9 * scale;
  ctx.strokeStyle = "rgba(255,226,170,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * tilt, 0, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const len = i % 6 === 0 ? 9 : 4;
    ctx.strokeStyle = `rgba(255,226,170,${i % 6 === 0 ? 0.28 : 0.14})`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * ringR, Math.sin(a) * ringR * tilt);
    ctx.lineTo(Math.cos(a) * (ringR + len), Math.sin(a) * (ringR + len) * tilt);
    ctx.stroke();
  }

  // orbits
  PLANETS.forEach((p, i) => {
    const r = p.orbit * scale;
    ctx.strokeStyle = `rgba(255,220,160,${0.17 - i * 0.015})`;
    ctx.setLineDash(i % 2 ? [2, 7] : []);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * tilt, 0, 0, TAU);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // asteroid belt
  ctx.fillStyle = "rgba(220,200,170,0.55)";
  for (const rock of ROCKS) {
    const a = rock.a + t * 0.001 * rock.s;
    ctx.fillRect(Math.cos(a) * rock.r * scale, Math.sin(a) * rock.r * scale * tilt, rock.size, rock.size);
  }

  // sun: rays, corona, core
  const pulse = 1 + Math.sin(t * 0.0012) * 0.04;
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * TAU + t * 0.00004;
    const len = (36 + ((i * 37) % 70)) * pulse * (scale / 900);
    ctx.strokeStyle = `rgba(255,170,70,${0.04 + (i % 3) * 0.04})`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24 * tilt * 1.4);
    ctx.lineTo(Math.cos(a) * (24 + len), Math.sin(a) * (24 + len) * tilt * 1.4);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 170 * pulse);
  glow.addColorStop(0, "rgba(255,210,130,0.95)");
  glow.addColorStop(0.1, "rgba(255,150,50,0.55)");
  glow.addColorStop(0.4, "rgba(255,95,25,0.14)");
  glow.addColorStop(1, "rgba(255,90,20,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 170 * pulse, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  const core = ctx.createRadialGradient(-4, -4, 1, 0, 0, 17);
  core.addColorStop(0, "#fff7d6");
  core.addColorStop(0.5, "#ffb347");
  core.addColorStop(1, "#ea580c");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 15 * pulse, 0, TAU);
  ctx.fill();

  // planets lit from the sun, with labels
  ctx.font = "9px ui-monospace, Menlo, monospace";
  PLANETS.forEach((p) => {
    const a = p.angle + t * 0.001 * p.speed;
    const r = p.orbit * scale;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * tilt;
    if (p.ring) {
      ctx.strokeStyle = "rgba(240,214,170,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size * 2.2, p.size * 0.7, -0.35, 0, TAU);
      ctx.stroke();
    }
    const dx = -px, dy = -py;
    const len = Math.hypot(dx, dy) || 1;
    const sprite = spriteFor(p);
    if (sprite) ctx.drawImage(sprite, px - p.size, py - p.size, p.size * 2, p.size * 2);
    else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, TAU);
      ctx.fill();
    }
    // night side: darken the hemisphere facing away from the sun
    const night = ctx.createRadialGradient(px + (dx / len) * p.size * 0.7, py + (dy / len) * p.size * 0.7, p.size * 0.35, px, py, p.size * 1.15);
    night.addColorStop(0, "rgba(3,5,12,0)");
    night.addColorStop(0.6, "rgba(3,5,12,0.35)");
    night.addColorStop(1, "rgba(3,5,12,0.92)");
    ctx.fillStyle = night;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, TAU);
    ctx.fill();
    if (p.ring) {
      ctx.strokeStyle = "rgba(240,214,170,0.6)";
      ctx.beginPath();
      ctx.ellipse(px, py, p.size * 2.2, p.size * 0.7, -0.35, 0, Math.PI);
      ctx.stroke();
    }
    if (p.moon) {
      const ma = t * 0.004;
      ctx.fillStyle = "#d8dde6";
      ctx.beginPath();
      ctx.arc(px + Math.cos(ma) * 11, py + Math.sin(ma) * 4.5, 1.3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,226,170,0.38)";
    ctx.fillText(p.name, px + p.size + 6, py - p.size - 3);
  });
  ctx.restore();

  // stars with parallax, tint and twinkle
  for (const s of stars) {
    const drift = (t * 0.000004 * (0.3 + s.z)) % 1;
    const sx = (((s.x + drift) % 1) * w + pointer.x * s.z * 24 + w) % w;
    const sy = s.y * h + pointer.y * s.z * 17;
    const tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
    const size = 0.4 + s.z * 1.5;
    ctx.fillStyle = `rgba(${TINTS[s.tint]},${(0.25 + s.z * 0.65) * tw})`;
    ctx.fillRect(sx, sy, size, size);
    if (s.z > 0.93) {
      const a = Math.round(tw * 90 + 20).toString(16).padStart(2, "0");
      ctx.fillStyle = `${tint}${a}`;
      ctx.fillRect(sx - 5, sy + size / 2 - 0.3, 11, 0.7);
      ctx.fillRect(sx + size / 2 - 0.3, sy - 5, 0.7, 11);
    }
  }

  if (comet) {
    const tail = 150;
    const g = ctx.createLinearGradient(comet.x, comet.y, comet.x - comet.vx * tail, comet.y - comet.vy * tail);
    g.addColorStop(0, "rgba(190,230,255,0.9)");
    g.addColorStop(1, "rgba(120,180,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(comet.x - comet.vx * tail, comet.y - comet.vy * tail);
    ctx.stroke();
    ctx.fillStyle = "#e8f6ff";
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, 2.6, 0, TAU);
    ctx.fill();
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

function Nebula({ palette }: { palette: Preferences["wallpaper"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.classList.remove("is-ready");
    // generate after the first paint so the lock screen is never blocked
    const timer = window.setTimeout(() => {
      ctx.putImageData(renderNebula(palette), 0, 0);
      canvas.classList.add("is-ready");
    }, 30);
    return () => window.clearTimeout(timer);
  }, [palette]);
  return <canvas ref={ref} width={1024} height={576} className="os-nebula" aria-hidden />;
}

function LiveCosmos({ reduced, tint, root }: { reduced: boolean; tint: string; root: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const stars = makeStars();
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let w = 0, h = 0, raf = 0;
    let shooting: { x: number; y: number; life: number } | null = null;
    let comet: Comet | null = null;
    let nextShot = 3500;
    let nextComet = 9000;
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
      root.current?.style.setProperty("--px", pointer.x.toFixed(3));
      root.current?.style.setProperty("--py", pointer.y.toFixed(3));
      nextShot -= dt;
      nextComet -= dt;
      if (!shooting && nextShot <= 0) {
        shooting = { x: Math.random() * w * 0.6, y: Math.random() * h * 0.4, life: 0 };
        nextShot = 5000 + Math.random() * 7000;
      }
      if (!comet && nextComet <= 0) {
        const fromLeft = Math.random() > 0.5;
        comet = { x: fromLeft ? -40 : w + 40, y: h * (0.1 + Math.random() * 0.3), vx: (fromLeft ? 1 : -1) * (0.22 + Math.random() * 0.1), vy: 0.07, life: 0 };
        nextComet = 16000 + Math.random() * 14000;
      }
      if (shooting) {
        shooting.life += dt / 900;
        if (shooting.life >= 1) shooting = null;
      }
      if (comet) {
        comet.x += comet.vx * dt;
        comet.y += comet.vy * dt;
        if (comet.x < -300 || comet.x > w + 300 || comet.y > h + 100) comet = null;
      }
      drawScene(ctx, w, h, t, stars, pointer, shooting, comet, tint);
      raf = requestAnimationFrame(frame);
    };
    const still = () => drawScene(ctx, w, h, 12000, stars, pointer, null, null, tint);
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const onResize = () => {
      resize();
      if (reduced) still();
    };
    resize();
    if (reduced) still();
    else {
      raf = requestAnimationFrame(frame);
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
  const root = useRef<HTMLDivElement>(null);
  const tint = { cyan: "#67e8f9", violet: "#c4b5fd", amber: "#fcd34d" }[accent];
  return (
    <div ref={root} className={`os-wallpaper is-${mode} ${locked ? "is-locked" : ""} ${reduced ? "is-still" : ""}`} aria-hidden>
      <Nebula palette={mode} />
      <LiveCosmos reduced={reduced} tint={tint} root={root} />
      <div className="absolute inset-0 os-vignette" />
    </div>
  );
}
