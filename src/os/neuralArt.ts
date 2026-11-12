/**
 * Geometry for the "neural brain" wallpaper, authored in a 0..1 design square and scaled to the screen:
 * a right hemisphere with cortical folds, a left hemisphere dissolving into circuit traces around a chip,
 * and a spider-web of strands radiating from that chip. Everything that moves travels along these paths.
 */
export type P = [number, number];
export type Path = { pts: P[]; cum: number[]; len: number; kind: "trace" | "web" | "ring" | "fold"; pad: number };

const TAU = Math.PI * 2;
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function spline(pts: P[], per = 10): P[] {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const mk = (pts: P[], kind: Path["kind"], pad = -1): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1], kind, pad };
};

/** Point and direction at distance d along a path. */
export function along(path: Path, d: number): P {
  const { pts, cum } = path;
  if (d <= 0) return pts[0];
  if (d >= path.len) return pts[pts.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const f = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f];
}

// ── design-space geometry (0..1) ──
const RIGHT_OUTLINE: P[] = [
  [0.505, 0.14], [0.525, 0.108], [0.575, 0.105], [0.625, 0.125], [0.665, 0.16], [0.7, 0.2], [0.745, 0.23], [0.775, 0.28],
  [0.8, 0.33], [0.815, 0.39], [0.82, 0.45], [0.805, 0.52], [0.785, 0.58], [0.745, 0.64], [0.7, 0.69], [0.64, 0.725], [0.575, 0.74], [0.505, 0.74],
];
const LEFT_OUTLINE: P[] = [[0.495, 0.14], [0.47, 0.108], [0.425, 0.105], [0.375, 0.125], [0.335, 0.165], [0.31, 0.215], [0.3, 0.27]];
const FOLDS: P[][] = [
  [[0.6, 0.18], [0.575, 0.21], [0.595, 0.255], [0.645, 0.265], [0.675, 0.23]],
  [[0.515, 0.27], [0.55, 0.245], [0.595, 0.29], [0.625, 0.34], [0.67, 0.35]],
  [[0.515, 0.2], [0.55, 0.19], [0.575, 0.165]],
  [[0.53, 0.38], [0.58, 0.365], [0.63, 0.41], [0.69, 0.4], [0.745, 0.355]],
  [[0.665, 0.285], [0.7, 0.3], [0.735, 0.285]],
  [[0.515, 0.47], [0.57, 0.46], [0.625, 0.5], [0.69, 0.5], [0.745, 0.465]],
  [[0.52, 0.55], [0.58, 0.575], [0.64, 0.555], [0.7, 0.595], [0.75, 0.57]],
  [[0.535, 0.64], [0.6, 0.665], [0.665, 0.64]],
  [[0.605, 0.4], [0.6, 0.44], [0.62, 0.47]],
  [[0.7, 0.43], [0.725, 0.46], [0.77, 0.45]],
  [[0.56, 0.52], [0.585, 0.5]],
];
const CHIP: P = [0.41, 0.445];
const CHIP_HALF = 0.032;

export type Art = {
  S: number;
  chip: { x: number; y: number; half: number };
  rightOutline: P[];
  leftOutline: P[];
  folds: P[][];
  paths: Path[];
  pads: P[];
  web: { spokes: P[][]; rings: P[][]; nodes: P[] };
  inRight: (x: number, y: number) => boolean;
  midX: number;
  box: { x0: number; y0: number; x1: number; y1: number };
};

export function buildArt(w: number, h: number): Art {
  // The whole drawing (design y 0.105 → 0.95, x 0.075 → 0.82) must fit between the menu bar and the dock.
  const topSpace = 44, dockSpace = 122;
  const availH = Math.max(200, h - topSpace - dockSpace);
  const S = Math.min(availH / 0.86, (w * 0.96) / 0.76);
  const ox = w * 0.5 - 0.4475 * S;
  const oy = topSpace + (availH - 0.845 * S) / 2 - 0.105 * S;
  const X = (u: number) => ox + u * S;
  const Y = (v: number) => oy + v * S;
  const tp = (p: P): P => [X(p[0]), Y(p[1])];

  const rightOutline = spline(RIGHT_OUTLINE, 8).map(tp);
  const leftOutline = spline(LEFT_OUTLINE, 8).map(tp);
  const folds = FOLDS.map((f) => spline(f, 8).map(tp));
  const chip = { x: X(CHIP[0]), y: Y(CHIP[1]), half: CHIP_HALF * S };

  // ── circuit traces: straight out of a pin, a 45° jog, then straight to a pad ──
  const paths: Path[] = [];
  const pads: P[] = [];
  const addTrace = (pin: P, outward: "u" | "d" | "l", pad: P) => {
    const L = 0.026;
    const pts: P[] = [pin];
    if (outward === "l") {
      const a: P = [pin[0] - L, pin[1]];
      const dy = pad[1] - pin[1];
      const b: P = [a[0] - Math.abs(dy), pad[1]];
      pts.push(a, b, [pad[0], pad[1]]);
    } else {
      const sgn = outward === "u" ? -1 : 1;
      const a: P = [pin[0], pin[1] + sgn * L];
      const dx = pad[0] - pin[0];
      const b: P = [pad[0], a[1] + sgn * Math.abs(dx)];
      pts.push(a, b, [pad[0], pad[1]]);
    }
    pads.push(tp(pad));
    paths.push(mk(pts.map(tp), "trace", pads.length - 1));
  };
  const r = rng(7);
  const topPads: P[] = [[0.3, 0.3], [0.335, 0.22], [0.375, 0.17], [0.42, 0.14], [0.46, 0.19], [0.485, 0.27]];
  topPads.forEach((pad, i) => addTrace([CHIP[0] - 0.025 + i * 0.01, CHIP[1] - CHIP_HALF], "u", pad));
  const leftPads: P[] = [[0.1, 0.31], [0.16, 0.355], [0.075, 0.395], [0.15, 0.435], [0.095, 0.48], [0.18, 0.52], [0.12, 0.565]];
  leftPads.forEach((pad, i) => addTrace([CHIP[0] - CHIP_HALF, CHIP[1] - 0.03 + i * 0.01], "l", pad));
  const botPads: P[] = [[0.34, 0.9], [0.385, 0.93], [0.425, 0.88], [0.465, 0.95], [0.5, 0.91], [0.535, 0.86]];
  botPads.forEach((pad, i) => addTrace([CHIP[0] - 0.025 + i * 0.01, CHIP[1] + CHIP_HALF], "d", pad));
  void r;

  // ── spider web radiating from the chip ──
  const spokesN = 18;
  const maxR = Math.hypot(w, h) * 0.62;
  const spokeAngle = (i: number) => (i / spokesN) * TAU + 0.18 + Math.sin(i * 2.7) * 0.05;
  const spokes: P[][] = [];
  for (let i = 0; i < spokesN; i++) {
    const a = spokeAngle(i);
    spokes.push([[chip.x + Math.cos(a) * chip.half * 1.6, chip.y + Math.sin(a) * chip.half * 1.6], [chip.x + Math.cos(a) * maxR, chip.y + Math.sin(a) * maxR]]);
  }
  const rings: P[][] = [];
  const nodes: P[] = [];
  let ring = S * 0.13;
  while (ring < maxR) {
    const poly: P[] = [];
    for (let i = 0; i < spokesN; i++) {
      const a0 = spokeAngle(i), a1 = spokeAngle(i + 1) + (i === spokesN - 1 ? TAU : 0);
      const p0: P = [chip.x + Math.cos(a0) * ring, chip.y + Math.sin(a0) * ring];
      const p1: P = [chip.x + Math.cos(a1) * ring, chip.y + Math.sin(a1) * ring];
      nodes.push(p0);
      const am = (a0 + a1) / 2;
      const c: P = [chip.x + Math.cos(am) * ring * 0.93, chip.y + Math.sin(am) * ring * 0.93];
      for (let k = 0; k < 8; k++) {
        const t = k / 8;
        poly.push([(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]);
      }
    }
    poly.push(poly[0]);
    rings.push(poly);
    ring *= 1.34;
  }
  spokes.forEach((s) => paths.push(mk(s, "web")));
  rings.filter((_, i) => i % 2 === 0).forEach((poly) => paths.push(mk(poly, "ring")));
  folds.forEach((f) => paths.push(mk(f, "fold")));

  // point-in-right-hemisphere test (even-odd on the sampled outline closed along the midline)
  const midX = X(0.505);
  const poly = [...rightOutline];
  const inRight = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside && x >= midX;
  };
  const xs = rightOutline.map((p) => p[0]), ys = rightOutline.map((p) => p[1]);
  return {
    S,
    chip,
    rightOutline,
    leftOutline,
    folds,
    paths,
    pads,
    web: { spokes, rings, nodes },
    inRight,
    midX,
    box: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
  };
}
