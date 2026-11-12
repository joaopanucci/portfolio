/**
 * A tiny game-engine core: entities with components, a gravity system and a
 * fixed-timestep loop. It mirrors the structure of the Java sample shown in
 * the Nyron Lab, so the code on the right is what this simulation "is".
 */
export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  mass: number;
  radius: number;
  color: string;
  trail: number[];
  fixed?: boolean;
};

export type Preset = "solar" | "moon" | "binary" | "figure8" | "pythagorean";
export const PRESETS: Preset[] = ["solar", "moon", "binary", "figure8", "pythagorean"];

export const STEP = 1 / 120;
const G = 1;
const MAX_TRAIL = 140;
export const PLANET_COLORS = ["#67e8f9", "#c4b5fd", "#fbbf24", "#fb7185", "#4ade80", "#f0abfc"];

export const isStar = (b: Pick<Body, "mass">) => b.mass >= 0.1;
const softening = (preset: Preset) => (preset === "figure8" ? 0.002 : preset === "pythagorean" ? 0.004 : 0.012);

function star(x: number, y: number, vx: number, vy: number, mass: number, radius: number, color: string, fixed = false): Body {
  return { x, y, vx, vy, ax: 0, ay: 0, mass, radius, color, trail: [], fixed };
}

export class World {
  bodies: Body[] = [];
  ticks = 0;
  preset: Preset = "solar";

  constructor() {
    this.load("solar");
  }

  load(preset: Preset) {
    this.preset = preset;
    this.ticks = 0;
    if (preset === "solar") {
      this.bodies = [star(0, 0, 0, 0, 1, 0.07, "#fde68a", true)];
      [0.28, 0.46, 0.7, 0.92].forEach((r, i) => this.launchCircular(r, i * 1.9, i % 2 ? -1 : 1, PLANET_COLORS[i]));
    } else if (preset === "moon") {
      // a heavy planet drags a moon along inside its Hill sphere
      const r = 0.62;
      const vp = Math.sqrt(G / r);
      const m = 0.01;
      const rm = 0.03;
      this.bodies = [
        star(0, 0, 0, 0, 1, 0.07, "#fde68a", true),
        { x: r, y: 0, vx: 0, vy: vp, ax: 0, ay: 0, mass: m, radius: 0.026, color: "#67e8f9", trail: [] },
        { x: r + rm, y: 0, vx: 0, vy: vp + Math.sqrt((G * m) / rm), ax: 0, ay: 0, mass: 1e-6, radius: 0.012, color: "#e2e8f0", trail: [] },
      ];
      this.launchCircular(0.3, 2.2, -1, PLANET_COLORS[2]);
    } else if (preset === "pythagorean") {
      // Burrau's problem: masses 3, 4 and 5 released from rest at the corners of a 3-4-5 triangle
      const raw: [number, number, number, string][] = [
        [3, 1, 3, "#67e8f9"],
        [4, -2, -1, "#fb7185"],
        [5, 1, -1, "#fde68a"],
      ];
      const total = 12;
      const cx = raw.reduce((s, [m, x]) => s + m * x, 0) / total;
      const cy = raw.reduce((s, [m, , y]) => s + m * y, 0) / total;
      this.bodies = raw.map(([m, x, y, c]) => star((x - cx) * 0.2, (y - cy) * 0.2, 0, 0, m / total, 0.03 + (m / total) * 0.05, c));
    } else if (preset === "binary") {
      // two equal stars on circular orbits around their centre of mass
      const v = Math.sqrt((G * 0.5) / (2 * 0.5));
      this.bodies = [
        star(0.25, 0, 0, v, 0.5, 0.05, "#fde68a"),
        star(-0.25, 0, 0, -v, 0.5, 0.05, "#fb923c"),
      ];
      this.launchCircular(1.05, 0.6, 1, PLANET_COLORS[0]);
      this.launchCircular(0.82, 3.8, -1, PLANET_COLORS[1]);
    } else {
      // Chenciner–Montgomery figure-eight: three equal masses chasing each other
      const x = 0.97000436, y = -0.24308753;
      const vx = 0.93240737, vy = 0.86473146;
      this.bodies = [
        star(x, y, vx / 2, vy / 2, 1, 0.035, "#67e8f9"),
        star(-x, -y, vx / 2, vy / 2, 1, 0.035, "#fb7185"),
        star(0, 0, -vx, -vy, 1, 0.035, "#fde68a"),
      ];
    }
    this.accelerate();
  }

  reset() {
    this.load(this.preset);
  }

  launchCircular(r: number, angle: number, dir: 1 | -1, color: string) {
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const total = this.bodies.filter(isStar).reduce((sum, b) => sum + b.mass, 0) || 1;
    const v = Math.sqrt((G * total) / r) * dir;
    this.spawn(x, y, -Math.sin(angle) * v, Math.cos(angle) * v, color);
  }

  spawn(x: number, y: number, vx: number, vy: number, color: string) {
    const planets = this.bodies.filter((b) => !isStar(b));
    if (planets.length > 56) this.bodies.splice(this.bodies.indexOf(planets[0]), 1);
    this.bodies.push({ x, y, vx, vy, ax: 0, ay: 0, mass: 1e-5, radius: 0.016, color, trail: [] });
  }

  /** Gravity system: every body pulls on every other body (softened Newtonian gravity). */
  private accelerate() {
    const eps2 = softening(this.preset) ** 2;
    for (const b of this.bodies) {
      if (b.fixed) continue;
      let ax = 0, ay = 0;
      for (const o of this.bodies) {
        if (o === b) continue;
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const d2 = dx * dx + dy * dy + eps2;
        const inv = (G * o.mass) / (d2 * Math.sqrt(d2));
        ax += dx * inv;
        ay += dy * inv;
      }
      b.ax = ax;
      b.ay = ay;
    }
  }

  /** Velocity-Verlet integration with a fixed time step. */
  update(dt: number) {
    for (const b of this.bodies) {
      if (b.fixed) continue;
      b.x += b.vx * dt + 0.5 * b.ax * dt * dt;
      b.y += b.vy * dt + 0.5 * b.ay * dt * dt;
      b.vx += 0.5 * b.ax * dt;
      b.vy += 0.5 * b.ay * dt;
    }
    this.accelerate();
    for (const b of this.bodies) {
      if (b.fixed) continue;
      b.vx += 0.5 * b.ax * dt;
      b.vy += 0.5 * b.ay * dt;
    }
    this.ticks++;
    if (this.ticks % 4 === 0) {
      for (const b of this.bodies) {
        if (b.fixed) continue;
        b.trail.push(b.x, b.y);
        if (b.trail.length > MAX_TRAIL * 2) b.trail.splice(0, 2);
      }
    }
    // planets that fall into a star or escape the system are removed
    const stars = this.bodies.filter(isStar);
    this.bodies = this.bodies.filter(
      (b) =>
        isStar(b) ||
        (Math.hypot(b.x, b.y) < 4 && !stars.some((s) => Math.hypot(b.x - s.x, b.y - s.y) < s.radius * 0.8)),
    );
  }
}

/** Path a planet would follow from the given state, for the launch preview (stars frozen in place). */
export function predict(
  x: number,
  y: number,
  vx: number,
  vy: number,
  stars: { x: number; y: number; mass: number }[],
  steps = 260,
  every = 4,
) {
  const path: number[] = [];
  const acc = (px: number, py: number) => {
    let ax = 0, ay = 0;
    for (const s of stars) {
      const dx = s.x - px, dy = s.y - py;
      const d2 = dx * dx + dy * dy + 0.012 * 0.012;
      const inv = (G * s.mass) / (d2 * Math.sqrt(d2));
      ax += dx * inv;
      ay += dy * inv;
    }
    return [ax, ay];
  };
  let [ax, ay] = acc(x, y);
  for (let i = 0; i < steps * every; i++) {
    x += vx * STEP + 0.5 * ax * STEP * STEP;
    y += vy * STEP + 0.5 * ay * STEP * STEP;
    vx += 0.5 * ax * STEP;
    vy += 0.5 * ay * STEP;
    [ax, ay] = acc(x, y);
    vx += 0.5 * ax * STEP;
    vy += 0.5 * ay * STEP;
    if (i % every === 0) path.push(x, y);
    if (Math.hypot(x, y) > 4 || stars.some((s) => Math.hypot(x - s.x, y - s.y) < 0.04)) break;
  }
  return path;
}

/** One Earth-like orbit, 3650 steps, same maths as the Java NyronDemo. */
export function runOrbit() {
  const GMau = 4 * Math.PI * Math.PI;
  const N = 3650;
  const dt = 1 / N;
  let x = 1, y = 0, vx = 0, vy = 2 * Math.PI;
  const acc = (px: number, py: number) => {
    const r2 = px * px + py * py;
    const inv = -GMau / (r2 * Math.sqrt(r2));
    return [px * inv, py * inv];
  };
  let [ax, ay] = acc(x, y);
  let min = Infinity, max = 0;
  const start = performance.now();
  for (let i = 0; i < N; i++) {
    x += vx * dt + 0.5 * ax * dt * dt;
    y += vy * dt + 0.5 * ay * dt * dt;
    const [nx, ny] = acc(x, y);
    vx += 0.5 * (ax + nx) * dt;
    vy += 0.5 * (ay + ny) * dt;
    ax = nx;
    ay = ny;
    const r = Math.hypot(x, y);
    min = Math.min(min, r);
    max = Math.max(max, r);
  }
  const micros = Math.max(1, Math.round((performance.now() - start) * 1000));
  return { min, max, drift: Math.abs(Math.hypot(x, y) - 1), micros };
}
