import { fbm } from "./nebula";

export type Focus = { x: number; y: number; r: number };
type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function glow(c: Ctx, x: number, y: number, r: number, rgb: string, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.45, `rgba(${rgb},${a * 0.3})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

function sphere(c: Ctx, x: number, y: number, r: number, color: string) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.35, color);
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

/* ───────── seeded data ───────── */
const R1 = rng(3);
const DUST = Array.from({ length: 170 }, () => ({ x: R1(), y: R1(), z: R1(), p: R1() * TAU, s: 0.4 + R1() * 1.4 }));
const BANG = Array.from({ length: 220 }, () => ({ a: R1() * TAU, s: 0.4 + R1() * 1.2, ph: R1(), size: 0.6 + R1() * 1.8 }));
const ATOMS = Array.from({ length: 46 }, () => ({ x: R1() * 2 - 1, y: R1() * 2 - 1, p: R1() * TAU, s: 0.4 + R1(), he: R1() < 0.28 }));
const SPIRAL = Array.from({ length: 1900 }, (_, i) => {
  const kind = R1();
  if (kind < 0.2) {
    const d = Math.pow(R1(), 1.6) * 0.3;
    return { r: d, a: R1() * TAU, size: 0.5 + R1() * 0.9 };
  }
  if (kind < 0.3) {
    const d = Math.pow(R1(), 0.8);
    return { r: d, a: R1() * TAU, size: 0.4 + R1() * 0.6 };
  }
  const d = 0.1 + Math.pow(R1(), 0.8) * 0.9;
  const scatter = (R1() - 0.5) * 0.5 * (1.15 - d * 0.6);
  return { r: d, a: Math.log(1 + d * 7) * 2.1 + (i % 2 ? Math.PI : 0) + scatter, size: 0.5 + R1() * 1.3 };
});
const DISK = Array.from({ length: 1100 }, () => {
  const r = 0.28 + Math.pow(R1(), 0.8) * 0.95;
  return { r, a: R1() * TAU, size: 0.5 + R1() * 1.2, jitter: (R1() - 0.5) * 0.07 };
});
const MICROBES = Array.from({ length: 22 }, () => ({ x: R1(), y: R1(), p: R1() * TAU, s: 0.3 + R1() * 0.8, size: 7 + R1() * 13, h: R1() }));
const MARINE = Array.from({ length: 90 }, () => ({ x: R1(), y: R1(), s: 0.2 + R1(), size: 0.6 + R1() * 1.4 }));
const JELLY = Array.from({ length: 9 }, () => ({ x: R1(), p: R1(), s: 0.00002 + R1() * 0.00003, size: 12 + R1() * 16 }));
const FERNS = Array.from({ length: 11 }, () => ({ x: R1(), h: 0.07 + R1() * 0.13, lean: (R1() - 0.5) * 0.5 }));
const SPARKS = Array.from({ length: 36 }, () => ({ x: (R1() - 0.5) * 30, p: R1(), s: 0.00045 + R1() * 0.0004, sway: R1() * TAU }));
const CHART = Array.from({ length: 70 }, () => ({ x: R1(), y: R1(), m: 0.5 + R1() * 1.6 }));
const NODES = Array.from({ length: 20 }, () => ({ x: R1(), y: R1(), p: R1() * TAU }));

/* ───────── shared backdrop ───────── */
export function backdrop(c: Ctx, w: number, h: number, t: number, f: Focus, tint: string, stars = true) {
  c.fillStyle = "#03050d";
  c.fillRect(0, 0, w, h);
  glow(c, f.x, f.y, f.r * 2.6, tint, 0.28);
  if (!stars) return;
  for (const s of DUST) {
    const tw = 0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p);
    c.fillStyle = `rgba(255,255,255,${(0.12 + s.z * 0.5) * tw})`;
    const size = 0.5 + s.z * 1.3;
    c.fillRect(s.x * w, s.y * h, size, size);
  }
}

/* ───────── scenes ───────── */
function bang(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.05;
  glow(c, f.x, f.y, f.r * 1.7 * pulse, "255,200,120", 0.85);
  glow(c, f.x, f.y, f.r * 0.55, "255,250,235", 1);
  for (let k = 0; k < 4; k++) {
    const p = (t * 0.00022 + k / 4) % 1;
    c.strokeStyle = `rgba(255,220,160,${(1 - p) * 0.35})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(f.x, f.y, f.r * (0.18 + p * 2.3), 0, TAU);
    c.stroke();
  }
  for (const p of BANG) {
    const q = (t * 0.00018 * p.s + p.ph) % 1;
    const d = q * f.r * 2.5;
    c.fillStyle = `rgba(255,${200 + 50 * (1 - q)},${150 + 90 * (1 - q)},${1 - q})`;
    c.fillRect(f.x + Math.cos(p.a) * d, f.y + Math.sin(p.a) * d, p.size, p.size);
  }
}

function nuclei(c: Ctx, w: number, h: number, t: number, f: Focus) {
  glow(c, f.x, f.y, f.r * 1.8, "255,170,90", 0.18);
  for (const a of ATOMS) {
    const x = f.x + a.x * f.r * 1.5 + Math.sin(t * 0.0008 * a.s + a.p) * 14;
    const y = f.y + a.y * f.r * 1.25 + Math.cos(t * 0.0007 * a.s + a.p) * 12;
    if (a.he) {
      const o = 5;
      [[-o, -o * 0.6, "#ff6b6b"], [o, -o * 0.6, "#6bb0ff"], [-o * 0.5, o, "#6bb0ff"], [o * 0.5, o * 0.6, "#ff6b6b"]].forEach(([dx, dy, col]) => {
        glow(c, x + (dx as number), y + (dy as number), 12, col === "#ff6b6b" ? "255,107,107" : "107,176,255", 0.5);
        sphere(c, x + (dx as number), y + (dy as number), 5.2, col as string);
      });
    } else {
      glow(c, x, y, 13, "255,107,107", 0.5);
      sphere(c, x, y, 5, "#ff6b6b");
    }
  }
}

let cmbMap: HTMLCanvasElement | null = null;
function makeCmb() {
  const cv = document.createElement("canvas");
  cv.width = 240;
  cv.height = 120;
  const x = cv.getContext("2d")!;
  const img = x.createImageData(240, 120);
  const stops: [number, number, number][] = [[24, 38, 140], [40, 120, 230], [120, 210, 230], [250, 225, 120], [240, 110, 60], [190, 40, 60]];
  for (let j = 0; j < 120; j++)
    for (let i = 0; i < 240; i++) {
      const n = clamp(fbm(i * 0.05, j * 0.05 + Math.sin(i * 0.08) * 0.4, 4) * 1.4 - 0.15);
      const p = n * (stops.length - 1);
      const k = Math.min(stops.length - 2, Math.floor(p));
      const a = stops[k], b = stops[k + 1], fr = p - k;
      const o = (j * 240 + i) * 4;
      img.data[o] = a[0] + (b[0] - a[0]) * fr;
      img.data[o + 1] = a[1] + (b[1] - a[1]) * fr;
      img.data[o + 2] = a[2] + (b[2] - a[2]) * fr;
      img.data[o + 3] = 255;
    }
  x.putImageData(img, 0, 0);
  return cv;
}
function cmb(c: Ctx, w: number, h: number, t: number, f: Focus) {
  cmbMap ??= makeCmb();
  const rx = f.r * 1.55, ry = f.r * 0.8;
  c.save();
  c.beginPath();
  c.ellipse(f.x, f.y, rx, ry, 0, 0, TAU);
  c.clip();
  const off = ((t * 0.006) % 240) / 240;
  const dw = rx * 2, dh = ry * 2;
  c.drawImage(cmbMap, f.x - rx - off * dw, f.y - ry, dw, dh);
  c.drawImage(cmbMap, f.x - rx - off * dw + dw, f.y - ry, dw, dh);
  c.restore();
  c.strokeStyle = "rgba(255,255,255,0.22)";
  c.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    c.beginPath();
    c.ellipse(f.x, f.y, rx * Math.cos(i * 0.3), ry, 0, 0, TAU);
    c.stroke();
    c.beginPath();
    c.moveTo(f.x - rx * Math.sqrt(1 - (i / 2.6) ** 2), f.y + (i / 2.6) * ry);
    c.lineTo(f.x + rx * Math.sqrt(1 - (i / 2.6) ** 2), f.y + (i / 2.6) * ry);
    c.stroke();
  }
  c.strokeStyle = "rgba(255,255,255,0.5)";
  c.beginPath();
  c.ellipse(f.x, f.y, rx, ry, 0, 0, TAU);
  c.stroke();
}

function firstStars(c: Ctx, w: number, h: number, t: number, f: Focus) {
  for (let i = 0; i < 4; i++) {
    const a = t * 0.00006 + i * 1.6;
    glow(c, f.x + Math.cos(a) * f.r * 0.9, f.y + Math.sin(a * 1.3) * f.r * 0.6, f.r * 1.1, i % 2 ? "70,60,170" : "40,70,160", 0.22);
  }
  const spots = [[-0.9, -0.3], [0.6, -0.7], [0.95, 0.25], [-0.3, 0.7], [0.1, -0.1], [-0.75, 0.55], [0.45, 0.65]];
  spots.forEach(([sx, sy], i) => {
    const phase = ((t * 0.0004 - i * 0.7) % 7) / 7;
    const b = phase < 0 ? 0 : phase < 0.3 ? phase / 0.3 : 1 - (phase - 0.3) * 0.15;
    const x = f.x + sx * f.r * 1.3, y = f.y + sy * f.r * 1.05;
    glow(c, x, y, f.r * (0.25 + b * 0.35), "150,190,255", b * 0.7);
    c.fillStyle = `rgba(235,245,255,${b})`;
    c.fillRect(x - 1.5, y - 1.5, 3, 3);
    c.fillStyle = `rgba(190,215,255,${b * 0.7})`;
    c.fillRect(x - f.r * 0.12 * b, y - 0.5, f.r * 0.24 * b, 1);
    c.fillRect(x - 0.5, y - f.r * 0.12 * b, 1, f.r * 0.24 * b);
  });
}

function spiral(c: Ctx, f: Focus, t: number, R: number, ox: number, oy: number, tilt: number, rot: number, count = SPIRAL.length) {
  c.save();
  c.translate(f.x + ox, f.y + oy);
  c.rotate(rot);
  c.globalCompositeOperation = "lighter";
  glow(c, 0, 0, R * 0.5, "255,220,170", 0.7);
  for (let i = 0; i < count; i++) {
    const s = SPIRAL[i];
    const a = s.a + t * 0.00006 * (1.5 - s.r);
    const k = s.r;
    c.fillStyle = `rgba(${Math.round(255 - k * 120)},${Math.round(215 - k * 40)},${Math.round(200 + k * 55)},${0.8 - k * 0.5})`;
    c.fillRect(Math.cos(a) * k * R, Math.sin(a) * k * R * tilt, s.size, s.size);
  }
  c.restore();
}
function galaxy(c: Ctx, w: number, h: number, t: number, f: Focus) {
  spiral(c, f, t, f.r * 1.45, 0, 0, 0.46, -0.45);
  spiral(c, f, t * 0.8, f.r * 0.45, -f.r * 1.3, -f.r * 0.8, 0.5, 0.6, 500);
  spiral(c, f, t * 1.2, f.r * 0.32, f.r * 1.15, f.r * 0.85, 0.7, 1.9, 350);
}

function disk(c: Ctx, w: number, h: number, t: number, f: Focus) {
  c.save();
  c.translate(f.x, f.y);
  c.rotate(-0.25);
  c.globalCompositeOperation = "lighter";
  glow(c, 0, 0, f.r * 0.9, "255,170,70", 0.8);
  for (const p of DISK) {
    const a = p.a + t * 0.0004 * Math.pow(p.r, -1.5) * 0.35;
    const k = (p.r - 0.28) / 0.95;
    c.fillStyle = `rgba(255,${Math.round(210 - k * 90)},${Math.round(150 - k * 90)},${0.75 - k * 0.45})`;
    c.fillRect(Math.cos(a) * p.r * f.r * 1.5, Math.sin(a) * p.r * f.r * 0.42 + p.jitter * f.r, p.size, p.size);
  }
  [0.55, 0.8, 1.1].forEach((r, i) => {
    const a = t * 0.0004 * Math.pow(r, -1.5) * 0.35 + i * 2;
    glow(c, Math.cos(a) * r * f.r * 1.5, Math.sin(a) * r * f.r * 0.42, 14, "200,220,255", 0.9);
  });
  c.globalCompositeOperation = "source-over";
  sphere(c, 0, 0, f.r * 0.13, "#ffd37a");
  c.restore();
}

function earth(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const R = f.r * 0.82;
  // moon behind
  const ma = t * 0.0004;
  const mx = f.x + Math.cos(ma) * R * 1.75, my = f.y + Math.sin(ma) * R * 0.45;
  const moonFront = Math.sin(ma) > 0;
  if (!moonFront) sphere(c, mx, my, R * 0.16, "#cfd4dc");
  glow(c, f.x, f.y, R * 1.45, "90,160,255", 0.3);
  c.save();
  c.beginPath();
  c.arc(f.x, f.y, R, 0, TAU);
  c.clip();
  const ocean = c.createRadialGradient(f.x - R * 0.35, f.y - R * 0.35, R * 0.1, f.x, f.y, R);
  ocean.addColorStop(0, "#4aa3ff");
  ocean.addColorStop(0.6, "#1b4fa8");
  ocean.addColorStop(1, "#0a2155");
  c.fillStyle = ocean;
  c.fillRect(f.x - R, f.y - R, R * 2, R * 2);
  // continents: blobs on a rotating sphere
  const lands = [[0.2, 0.25, 0.42], [1.4, -0.3, 0.5], [2.6, 0.45, 0.34], [3.8, 0.1, 0.55], [5.0, -0.5, 0.38], [0.9, -0.75, 0.3], [4.4, 0.7, 0.28]];
  for (const [lon0, lat, size] of lands) {
    const lon = lon0 + t * 0.00018;
    const cosL = Math.cos(lon);
    if (cosL < -0.2) continue;
    const x = f.x + R * Math.sin(lon) * Math.cos(lat);
    const y = f.y - R * Math.sin(lat);
    c.fillStyle = "rgba(70,150,90,0.95)";
    c.beginPath();
    c.ellipse(x, y, R * size * 0.6 * Math.max(0.15, cosL), R * size * 0.42, lat * 0.5, 0, TAU);
    c.fill();
  }
  // clouds
  for (let i = 0; i < 12; i++) {
    const lon = i * 0.55 + t * 0.00026;
    const cosL = Math.cos(lon);
    if (cosL < 0) continue;
    const lat = Math.sin(i * 1.7) * 0.9;
    c.fillStyle = "rgba(255,255,255,0.28)";
    c.beginPath();
    c.ellipse(f.x + R * Math.sin(lon) * Math.cos(lat), f.y - R * Math.sin(lat), R * 0.3 * cosL, R * 0.07, 0, 0, TAU);
    c.fill();
  }
  const shade = c.createRadialGradient(f.x - R * 0.55, f.y - R * 0.45, R * 0.2, f.x - R * 0.2, f.y - R * 0.1, R * 1.5);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.55, "rgba(0,0,10,0.15)");
  shade.addColorStop(1, "rgba(0,0,12,0.92)");
  c.fillStyle = shade;
  c.fillRect(f.x - R, f.y - R, R * 2, R * 2);
  c.restore();
  c.strokeStyle = "rgba(140,200,255,0.5)";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(f.x, f.y, R + 1, -2.6, 0.3);
  c.stroke();
  if (moonFront) sphere(c, mx, my, R * 0.16, "#cfd4dc");
}

function life(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(8,60,70,0.55)");
  g.addColorStop(1, "rgba(4,20,40,0.2)");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (const m of MARINE) {
    c.fillStyle = "rgba(180,255,230,0.25)";
    c.fillRect(((m.x * w + t * 0.01 * m.s) % w), ((m.y * h + t * 0.006 * m.s) % h), m.size, m.size);
  }
  for (const m of MICROBES) {
    const x = f.x + (m.x - 0.5) * f.r * 3.2 + Math.sin(t * 0.0005 * m.s + m.p) * 30;
    const y = f.y + (m.y - 0.5) * f.r * 2.4 + Math.cos(t * 0.0004 * m.s + m.p) * 24;
    const dir = Math.sin(t * 0.0005 * m.s + m.p + 0.4) > 0 ? 0.3 : -0.3;
    const rgb = m.h < 0.5 ? "120,255,200" : "150,220,255";
    glow(c, x, y, m.size * 2.4, rgb, 0.22);
    c.strokeStyle = `rgba(${rgb},0.55)`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x - m.size, y);
    for (let k = 1; k <= 10; k++) c.lineTo(x - m.size - k * 3.4, y + Math.sin(t * 0.008 + k * 0.7 + m.p) * 4 * (k / 10) * dir * 3);
    c.stroke();
    c.fillStyle = `rgba(${rgb},0.18)`;
    c.strokeStyle = `rgba(${rgb},0.7)`;
    c.beginPath();
    c.ellipse(x, y, m.size, m.size * 0.66, 0, 0, TAU);
    c.fill();
    c.stroke();
    c.fillStyle = `rgba(${rgb},0.65)`;
    c.beginPath();
    c.arc(x + m.size * 0.15, y, m.size * 0.26, 0, TAU);
    c.fill();
  }
}

function deepsea(c: Ctx, w: number, h: number, t: number) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(40,130,170,0.5)");
  g.addColorStop(1, "rgba(4,14,34,0.4)");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const x = w * (0.1 + i * 0.22) + Math.sin(t * 0.0003 + i) * 40;
    const rg = c.createLinearGradient(x, 0, x - 140, h);
    rg.addColorStop(0, "rgba(160,230,255,0.16)");
    rg.addColorStop(1, "rgba(160,230,255,0)");
    c.fillStyle = rg;
    c.beginPath();
    c.moveTo(x - 25, 0);
    c.lineTo(x + 25, 0);
    c.lineTo(x - 90, h);
    c.lineTo(x - 210, h);
    c.fill();
  }
  c.globalCompositeOperation = "source-over";
  for (const j of JELLY) {
    const y = h - ((j.p + t * j.s) % 1) * (h + 60) + 30;
    const x = j.x * w + Math.sin(t * 0.0008 + j.p * 9) * 18;
    c.fillStyle = "rgba(200,170,255,0.3)";
    c.strokeStyle = "rgba(220,200,255,0.6)";
    c.beginPath();
    c.ellipse(x, y, j.size, j.size * 0.7, 0, Math.PI, TAU);
    c.fill();
    c.stroke();
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(x + k * j.size * 0.4, y);
      c.bezierCurveTo(x + k * j.size * 0.5 + Math.sin(t * 0.004 + k) * 5, y + j.size * 0.8, x + k * j.size * 0.3, y + j.size * 1.4, x + k * j.size * 0.45 + Math.sin(t * 0.004) * 6, y + j.size * 2);
      c.stroke();
    }
  }
  // trilobites crawling on the seabed
  const floor = c.createLinearGradient(0, h * 0.8, 0, h);
  floor.addColorStop(0, "rgba(30,40,60,0)");
  floor.addColorStop(1, "rgba(30,40,60,0.9)");
  c.fillStyle = floor;
  c.fillRect(0, h * 0.8, w, h * 0.2);
  for (let i = 0; i < 4; i++) {
    const x = ((i * 0.31 + t * 0.00004 * (1 + i * 0.2)) % 1.2) * w - 40;
    const y = h * 0.9 + (i % 2) * 14;
    c.fillStyle = "rgba(210,190,150,0.9)";
    for (let k = 0; k < 8; k++) {
      c.beginPath();
      c.ellipse(x - k * 7, y, 5.5 - k * 0.3, 8 - Math.abs(k - 2) * 0.6, 0, 0, TAU);
      c.fill();
      c.fillStyle = k % 2 ? "rgba(210,190,150,0.9)" : "rgba(170,150,110,0.9)";
    }
  }
}

function meteor(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1b1040");
  sky.addColorStop(0.55, "#8a3a5a");
  sky.addColorStop(1, "#f08a4b");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  glow(c, f.x, h * 0.72, f.r * 1.2, "255,200,120", 0.6);
  // asteroid streaking in, looping
  const p = (t * 0.00008) % 1;
  const ax = w * 0.95 - p * w * 0.5, ay = h * 0.02 + p * h * 0.62;
  const tail = c.createLinearGradient(ax, ay, ax + 260, ay - 150);
  tail.addColorStop(0, "rgba(255,230,170,0.95)");
  tail.addColorStop(1, "rgba(255,120,40,0)");
  c.strokeStyle = tail;
  c.lineWidth = 6 + p * 10;
  c.beginPath();
  c.moveTo(ax, ay);
  c.lineTo(ax + 260, ay - 150);
  c.stroke();
  glow(c, ax, ay, 40 + p * 60, "255,190,90", 0.9);
  sphere(c, ax, ay, 6 + p * 10, "#ffdca0");
  // ferns and hills
  c.fillStyle = "#1a0f26";
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) c.lineTo(x, h * 0.86 + Math.sin(x * 0.01) * 10 + Math.sin(x * 0.027) * 6);
  c.lineTo(w, h);
  c.fill();
  c.strokeStyle = "#1a0f26";
  c.lineWidth = 2;
  for (const fern of FERNS) {
    const x = fern.x * w, y = h * 0.9, len = fern.h * h * 0.9;
    for (let k = 0; k < 7; k++) {
      const a = -2.3 + k * 0.7 + fern.lean * 0.4 + Math.sin(t * 0.0008 + x) * 0.03;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a) * len * 0.6, y + Math.sin(a) * len * 0.9, x + Math.cos(a) * len, y + Math.sin(a) * len * 0.6 + len * 0.3);
      c.stroke();
    }
  }
}

function campfire(c: Ctx, w: number, h: number, t: number, f: Focus) {
  glow(c, f.x + f.r * 1.1, f.y - f.r * 0.8, f.r * 0.3, "230,235,255", 0.5);
  sphere(c, f.x + f.r * 1.1, f.y - f.r * 0.8, f.r * 0.1, "#e8ecf8");
  c.fillStyle = "#070a14";
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) c.lineTo(x, h * 0.78 + Math.sin(x * 0.006) * 24 + Math.sin(x * 0.021) * 8);
  c.lineTo(w, h);
  c.fill();
  const fx = f.x, fy = h * 0.8;
  glow(c, fx, fy - 10, f.r * 1.1, "255,140,50", 0.5 + Math.sin(t * 0.02) * 0.06);
  c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 5; k++) {
    const fl = Math.sin(t * 0.012 + k * 2.1) * 0.12;
    const hh = 52 - k * 7 + fl * 40;
    const ww = 20 - k * 3;
    const col = ["255,80,20", "255,140,30", "255,190,70", "255,230,140", "255,250,220"][k];
    c.fillStyle = `rgba(${col},0.75)`;
    c.beginPath();
    c.moveTo(fx - ww, fy);
    c.bezierCurveTo(fx - ww, fy - hh * 0.5, fx + fl * 30, fy - hh * 0.7, fx + fl * 24, fy - hh);
    c.bezierCurveTo(fx + ww, fy - hh * 0.6, fx + ww, fy - hh * 0.3, fx + ww, fy);
    c.fill();
  }
  for (const s of SPARKS) {
    const q = (t * s.s + s.p) % 1;
    c.fillStyle = `rgba(255,${180 + 60 * (1 - q)},90,${1 - q})`;
    c.fillRect(fx + s.x * 0.6 + Math.sin(q * 6 + s.sway) * 14, fy - 20 - q * f.r * 1.2, 1.6, 1.6);
  }
  c.globalCompositeOperation = "source-over";
  c.fillStyle = "#04060c";
  for (const side of [-1, 1]) {
    const x = fx + side * 64;
    c.beginPath();
    c.arc(x, fy - 26, 8, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(x - 12, fy + 4);
    c.quadraticCurveTo(x - 8, fy - 20, x, fy - 18);
    c.quadraticCurveTo(x + 8, fy - 20, x + 12, fy + 4);
    c.fill();
  }
}

function chart(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const R = f.r * 1.4;
  c.strokeStyle = "rgba(255,226,170,0.28)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(f.x, f.y, R, 0, TAU);
  c.stroke();
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * TAU;
    const len = i % 10 === 0 ? 12 : 5;
    c.beginPath();
    c.moveTo(f.x + Math.cos(a) * R, f.y + Math.sin(a) * R);
    c.lineTo(f.x + Math.cos(a) * (R + len), f.y + Math.sin(a) * (R + len));
    c.stroke();
  }
  c.strokeStyle = "rgba(255,226,170,0.12)";
  for (const k of [0.35, 0.7]) {
    c.beginPath();
    c.arc(f.x, f.y, R * k, 0, TAU);
    c.stroke();
  }
  const pts = CHART.map((s) => {
    const a = s.x * TAU, r = Math.sqrt(s.y) * R * 0.96;
    return { x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r, m: s.m };
  });
  // constellation lines draw themselves, then fade
  const cycle = (t * 0.00018) % 1;
  c.strokeStyle = "rgba(160,200,255,0.45)";
  c.lineWidth = 1.2;
  for (let k = 0; k < 5; k++) {
    const idx = [k * 9, k * 9 + 3, k * 9 + 5, k * 9 + 8, k * 9 + 11].map((i) => pts[i % pts.length]);
    const prog = clamp(cycle * 6 - k * 0.7);
    c.beginPath();
    c.moveTo(idx[0].x, idx[0].y);
    const segs = (idx.length - 1) * prog;
    for (let i = 1; i <= Math.ceil(segs); i++) {
      const part = Math.min(1, segs - (i - 1));
      c.lineTo(idx[i - 1].x + (idx[i].x - idx[i - 1].x) * part, idx[i - 1].y + (idx[i].y - idx[i - 1].y) * part);
    }
    c.stroke();
  }
  for (const p of pts) {
    glow(c, p.x, p.y, 5 + p.m * 3, "255,236,190", 0.6);
    c.fillStyle = "#fff6dc";
    c.fillRect(p.x - p.m * 0.6, p.y - p.m * 0.6, p.m * 1.2, p.m * 1.2);
  }
}

const TRACES = (() => {
  const r = rng(21);
  return Array.from({ length: 34 }, () => {
    const pts: [number, number][] = [[r(), r()]];
    let x = pts[0][0], y = pts[0][1];
    for (let i = 0; i < 4; i++) {
      if (i % 2) y += (r() - 0.5) * 0.35;
      else x += (r() - 0.5) * 0.35;
      pts.push([x, y]);
    }
    return { pts, s: 0.00008 + r() * 0.00012, p: r() };
  });
})();
function circuit(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const S = f.r * 2.6;
  const X = (u: number) => f.x - S / 2 + u * S;
  const Y = (v: number) => f.y - S * 0.35 + v * S * 0.7;
  c.lineWidth = 1.2;
  for (const tr of TRACES) {
    c.strokeStyle = "rgba(90,200,255,0.2)";
    c.beginPath();
    tr.pts.forEach(([u, v], i) => (i ? c.lineTo(X(u), Y(v)) : c.moveTo(X(u), Y(v))));
    c.stroke();
    const q = (t * tr.s + tr.p) % 1;
    const seg = q * (tr.pts.length - 1);
    const i = Math.floor(seg), fr = seg - i;
    const a = tr.pts[i], b = tr.pts[Math.min(i + 1, tr.pts.length - 1)];
    glow(c, X(a[0] + (b[0] - a[0]) * fr), Y(a[1] + (b[1] - a[1]) * fr), 9, "120,230,255", 0.9);
    c.fillStyle = "#0b1626";
    c.strokeStyle = "rgba(120,220,255,0.5)";
    const [u, v] = tr.pts[0];
    c.fillRect(X(u) - 3, Y(v) - 3, 6, 6);
    c.strokeRect(X(u) - 3, Y(v) - 3, 6, 6);
  }
  // central chip
  c.fillStyle = "rgba(10,24,44,0.9)";
  c.strokeStyle = "rgba(120,220,255,0.7)";
  c.lineWidth = 1.5;
  c.fillRect(f.x - 46, f.y - 46, 92, 92);
  c.strokeRect(f.x - 46, f.y - 46, 92, 92);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = "rgba(120,220,255,0.7)";
    c.fillRect(f.x - 40 + i * 11, f.y - 54, 4, 8);
    c.fillRect(f.x - 40 + i * 11, f.y + 46, 4, 8);
    c.fillRect(f.x - 54, f.y - 40 + i * 11, 8, 4);
    c.fillRect(f.x + 46, f.y - 40 + i * 11, 8, 4);
  }
  glow(c, f.x, f.y, 50, "120,220,255", 0.25 + Math.sin(t * 0.004) * 0.1);
}

const CODE = [
  'public class Hello {',
  '    public static void main(String[] args) {',
  '        System.out.println("Hello, universe");',
  '    }',
  '}',
];
const KW = /\b(public|class|static|void)\b/g;
function code(c: Ctx, w: number, h: number, t: number, f: Focus) {
  const cw = Math.min(f.r * 3.1, w - 24), ch = f.r * 1.55;
  const x0 = f.x - cw / 2, y0 = f.y - ch / 2;
  glow(c, f.x, f.y, f.r * 1.8, "255,120,60", 0.2);
  c.fillStyle = "rgba(8,11,22,0.92)";
  c.strokeStyle = "rgba(255,255,255,0.16)";
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x0, y0, cw, ch, 12);
  c.fill();
  c.stroke();
  ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x0 + 16 + i * 16, y0 + 16, 4.5, 0, TAU);
    c.fill();
  });
  const total = CODE.join("\n").length;
  const typed = Math.floor(((t * 0.022) % (total + 40)));
  const fs = Math.max(10, Math.min(14, cw / 36));
  c.font = `${fs}px ui-monospace, Menlo, monospace`;
  c.textBaseline = "top";
  let left = typed;
  CODE.forEach((line, li) => {
    const shown = line.slice(0, Math.max(0, Math.min(line.length, left)));
    left -= line.length + 1;
    const y = y0 + 34 + li * (fs + 7);
    let x = x0 + 18;
    let idx = 0;
    const parts = shown.split(KW);
    for (const part of parts) {
      if (!part) continue;
      const isKw = /^(public|class|static|void)$/.test(part);
      c.fillStyle = isKw ? "#fc5fa3" : part.includes('"') || shown.slice(idx).startsWith('"') ? "#fc8a7d" : "#dfe6f2";
      c.fillText(part, x, y);
      x += c.measureText(part).width;
      idx += part.length;
    }
    if (left < 0 && left > -line.length - 2 && Math.floor(t / 450) % 2 === 0 && typed < total) {
      c.fillStyle = "#67e8f9";
      c.fillRect(x + 1, y, 2, fs + 2);
    }
  });
  c.textBaseline = "alphabetic";
}

export const NOW_NODES = [
  [-1.05, -0.35], [-0.45, 0.45], [0.15, -0.5], [0.7, 0.3], [1.15, -0.2],
];
function now(c: Ctx, w: number, h: number, t: number, f: Focus) {
  c.globalCompositeOperation = "lighter";
  spiral(c, f, t, f.r * 1.9, 0, 0, 0.4, -0.5, 900);
  c.globalCompositeOperation = "source-over";
  const pts = NOW_NODES.map(([nx, ny]) => ({ x: f.x + nx * f.r * 1.15, y: f.y + ny * f.r * 0.9 }));
  c.strokeStyle = "rgba(160,225,255,0.45)";
  c.lineWidth = 1.2;
  c.beginPath();
  [0, 1, 3, 4, 2, 0].forEach((i, k) => (k ? c.lineTo(pts[i].x, pts[i].y) : c.moveTo(pts[i].x, pts[i].y)));
  c.moveTo(pts[1].x, pts[1].y);
  c.lineTo(pts[3].x, pts[3].y);
  c.stroke();
  pts.forEach((p, i) => {
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.003 + i);
    glow(c, p.x, p.y, 26 * pulse, "170,230,255", 0.7);
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(p.x, p.y, 3, 0, TAU);
    c.fill();
  });
  for (const n of NODES) {
    c.fillStyle = `rgba(255,255,255,${0.2 + 0.3 * Math.sin(t * 0.002 + n.p)})`;
    c.fillRect(n.x * w, n.y * h, 1.4, 1.4);
  }
}

export type SceneKind =
  | "bang" | "nuclei" | "cmb" | "stars" | "galaxy" | "disk" | "earth" | "life"
  | "deepsea" | "meteor" | "campfire" | "chart" | "circuit" | "code" | "now";

export const sceneFor: Record<string, SceneKind> = {
  "big-bang": "bang",
  nuclei: "nuclei",
  cmb: "cmb",
  "first-stars": "stars",
  galaxies: "galaxy",
  sun: "disk",
  earth: "earth",
  life: "life",
  cambrian: "deepsea",
  dinosaurs: "meteor",
  humans: "campfire",
  writing: "chart",
  computers: "circuit",
  java: "code",
  now: "now",
};

const FULL: SceneKind[] = ["meteor", "life", "deepsea"];
const DRAW: Record<SceneKind, (c: Ctx, w: number, h: number, t: number, f: Focus) => void> = {
  bang, nuclei, cmb, stars: firstStars, galaxy, disk, earth, life, deepsea, meteor, campfire, chart, circuit, code, now,
};

export function drawScene(kind: SceneKind, c: Ctx, w: number, h: number, t: number, f: Focus, tint: string) {
  backdrop(c, w, h, t, f, tint, !FULL.includes(kind) || kind === "life");
  DRAW[kind](c, w, h, t, f);
}
