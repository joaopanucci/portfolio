"use client";
import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const CROSS_MS = 2500; // time the brain takes to cross the screen
const UNLOCK_MS = 1500; // when the desktop starts to appear behind it
const END_MS = 4800;

type Digit = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; bit: number; flip: number };

/** A running brain: where its feet land, binary digits spill out and float away. */
export function BrainRun({ tint, onUnlock, onDone }: { tint: string; onUnlock: () => void; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onUnlock, onDone });
  useEffect(() => {
    cb.current = { onUnlock, onDone };
  });

  useEffect(() => {
    const canvas = ref.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.max(34, Math.min(92, Math.min(w, h) * 0.09));
    const groundY = h * 0.72;
    const digits: Digit[] = [];
    let stepIdx = 0;
    let unlocked = false, trail = 0, raf = 0;
    const start = performance.now();
    let last = start;

    const burst = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++)
        digits.push({
          x: x + (Math.random() - 0.5) * s * 0.4,
          y,
          vx: (Math.random() - 0.5) * 90,
          vy: -(40 + Math.random() * 150),
          age: 0,
          life: 1.4 + Math.random() * 1.6,
          size: 16 + Math.random() * 16,
          bit: Math.random() < 0.5 ? 0 : 1,
          flip: Math.random() * 0.3,
        });
    };

    const drawBrain = (x: number, y: number, p: number) => {
      const rx = s, ry = s * 0.78;
      const bob = -Math.abs(Math.sin(p)) * s * 0.12;
      const cy = y + bob;
      const hipY = cy + ry * 0.82;
      c.save();
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = tint;
      c.shadowColor = tint;
      c.shadowBlur = 16;
      c.lineWidth = Math.max(2.4, s * 0.05);
      // legs
      for (let i = 0; i < 2; i++) {
        const ph = p + i * Math.PI;
        const hx = x + (i ? 0.26 : -0.26) * s;
        const fx = hx + Math.sin(ph) * s * 0.55;
        const lift = Math.max(0, Math.cos(ph)) * s * 0.3;
        const fy = groundY - lift;
        const kx = (hx + fx) / 2 + s * 0.14, ky = (hipY + fy) / 2 - s * 0.05;
        c.beginPath();
        c.moveTo(hx, hipY);
        c.lineTo(kx, ky);
        c.lineTo(fx, fy);
        c.lineTo(fx + s * 0.24, fy);
        c.stroke();
      }
      // cortex: outline from bump circles, filled with the dark body colour
      const bumps: [number, number, number][] = [];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * TAU;
        bumps.push([x + Math.cos(a) * rx * 0.78, cy + Math.sin(a) * ry * 0.78, s * 0.36]);
      }
      c.beginPath();
      bumps.forEach(([bx, by, r]) => {
        c.moveTo(bx + r, by);
        c.arc(bx, by, r, 0, TAU);
      });
      c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = "#04121f";
      c.beginPath();
      bumps.forEach(([bx, by, r]) => {
        c.moveTo(bx + r - 1, by);
        c.arc(bx, by, r - 1, 0, TAU);
      });
      c.ellipse(x, cy, rx * 0.86, ry * 0.86, 0, 0, TAU);
      c.fill();
      // folds
      c.lineWidth = Math.max(1.4, s * 0.03);
      c.strokeStyle = tint;
      c.globalAlpha = 0.85;
      c.beginPath();
      c.moveTo(x - s * 0.55, cy - s * 0.1);
      c.quadraticCurveTo(x - s * 0.25, cy - s * 0.5, x + s * 0.05, cy - s * 0.22);
      c.quadraticCurveTo(x + s * 0.3, cy + s * 0.02, x + s * 0.6, cy - s * 0.3);
      c.moveTo(x - s * 0.5, cy + s * 0.3);
      c.quadraticCurveTo(x - s * 0.1, cy + s * 0.1, x + s * 0.2, cy + s * 0.35);
      c.stroke();
      c.globalAlpha = 1;
      // eyes
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(x + s * 0.42, cy - s * 0.02, s * 0.075, 0, TAU);
      c.arc(x + s * 0.66, cy - s * 0.02, s * 0.075, 0, TAU);
      c.fill();
      c.restore();
    };

    const frame = (now: number) => {
      const t = now - start;
      const real = Math.min(0.25, (now - last) / 1000);
      const dt = real;
      last = now;
      c.clearRect(0, 0, w, h);

      const u = Math.min(1, t / CROSS_MS);
      const x = -s * 1.6 + (w + s * 3.2) * (u * 0.65 + u * u * (3 - 2 * u) * 0.35);
      const running = t < CROSS_MS;
      const p = x / (s * 0.9);
      // footfalls: one every half stride, computed from distance so low frame rates never skip them
      const stepNow = Math.floor(p / Math.PI);
      while (running && stepIdx < stepNow) {
        stepIdx++;
        const sx = (stepIdx * Math.PI) * s * 0.9 + (stepIdx % 2 ? 0.3 : -0.2) * s;
        burst(sx, groundY, 16);
      }
      if (running) {
        trail += dt;
        let spawned = 0;
        while (trail > 0.05 && spawned++ < 6) {
          trail -= 0.05;
          digits.push({
            x: x - s * 0.9,
            y: groundY - Math.random() * s * 1.6,
            vx: -(20 + Math.random() * 60),
            vy: -(10 + Math.random() * 50),
            age: 0,
            life: 0.9 + Math.random() * 0.9,
            size: 13 + Math.random() * 11,
            bit: Math.random() < 0.5 ? 0 : 1,
            flip: Math.random() * 0.3,
          });
        }
      }
      if (!unlocked && t >= UNLOCK_MS) {
        unlocked = true;
        cb.current.onUnlock();
      }

      // digits
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (let i = digits.length - 1; i >= 0; i--) {
        const d = digits[i];
        d.age += dt;
        if (d.age >= d.life) {
          digits.splice(i, 1);
          continue;
        }
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy *= 1 - dt * 0.8;
        d.vx *= 1 - dt * 0.6;
        d.flip -= dt;
        if (d.flip <= 0) {
          d.bit = d.bit ? 0 : 1;
          d.flip = 0.12 + Math.random() * 0.25;
        }
        const k = d.age / d.life;
        const a = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
        c.font = `600 ${d.size}px ui-monospace, "SF Mono", Menlo, monospace`;
        c.fillStyle = k < 0.4 ? `rgba(255,255,255,${a})` : tint;
        c.globalAlpha = Math.max(0, a);
        c.shadowColor = tint;
        c.shadowBlur = k < 0.4 ? 14 : 8;
        c.fillText(String(d.bit), d.x, d.y);
      }
      c.globalAlpha = 1;
      c.shadowBlur = 0;

      if (running || x < w + s * 2) drawBrain(x, groundY - s * 1.9, p);

      if (t < END_MS && (running || digits.length)) raf = requestAnimationFrame(frame);
      else cb.current.onDone();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [tint]);

  return <canvas ref={ref} className="os-brainrun" aria-hidden />;
}
