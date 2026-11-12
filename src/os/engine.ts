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

export const STEP = 1 / 120;
const GM = 1;
const SOFTENING = 0.012;
const MAX_TRAIL = 140;
export const PLANET_COLORS = ["#67e8f9", "#c4b5fd", "#fbbf24", "#fb7185", "#4ade80", "#f0abfc"];

export class World {
  bodies: Body[] = [];
  ticks = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.ticks = 0;
    this.bodies = [
      { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, mass: GM, radius: 0.07, color: "#fde68a", trail: [], fixed: true },
    ];
    [0.28, 0.46, 0.7, 0.92].forEach((r, i) => this.launchCircular(r, i * 1.9, i % 2 ? -1 : 1, PLANET_COLORS[i]));
  }

  launchCircular(r: number, angle: number, dir: 1 | -1, color: string) {
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const v = Math.sqrt(GM / r) * dir;
    this.spawn(x, y, -Math.sin(angle) * v, Math.cos(angle) * v, color);
  }

  spawn(x: number, y: number, vx: number, vy: number, color: string) {
    if (this.bodies.length > 60) this.bodies.splice(1, 1);
    this.bodies.push({ x, y, vx, vy, ax: 0, ay: 0, mass: 1e-5, radius: 0.016, color, trail: [] });
  }

  private accelerate() {
    const sun = this.bodies[0];
    for (const b of this.bodies) {
      if (b.fixed) continue;
      const dx = sun.x - b.x;
      const dy = sun.y - b.y;
      const d2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
      const inv = GM / (d2 * Math.sqrt(d2));
      b.ax = dx * inv;
      b.ay = dy * inv;
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
    // absorb bodies that fall into the star or escape the system
    const sun = this.bodies[0];
    this.bodies = this.bodies.filter(
      (b) =>
        b.fixed ||
        (Math.hypot(b.x - sun.x, b.y - sun.y) > sun.radius * 0.8 &&
          Math.hypot(b.x, b.y) < 4),
    );
  }
}

/** Path a body would follow from the given state, for the launch preview. */
export function predict(x: number, y: number, vx: number, vy: number, steps = 260, every = 4) {
  const path: number[] = [];
  let ax = 0, ay = 0;
  const acc = (px: number, py: number) => {
    const d2 = px * px + py * py + SOFTENING * SOFTENING;
    const inv = -GM / (d2 * Math.sqrt(d2));
    return [px * inv, py * inv];
  };
  [ax, ay] = acc(x, y);
  for (let i = 0; i < steps * every; i++) {
    x += vx * STEP + 0.5 * ax * STEP * STEP;
    y += vy * STEP + 0.5 * ay * STEP * STEP;
    vx += 0.5 * ax * STEP;
    vy += 0.5 * ay * STEP;
    [ax, ay] = acc(x, y);
    vx += 0.5 * ax * STEP;
    vy += 0.5 * ay * STEP;
    if (i % every === 0) path.push(x, y);
    if (Math.hypot(x, y) < 0.05 || Math.hypot(x, y) > 4) break;
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
