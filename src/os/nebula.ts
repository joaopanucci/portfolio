export type Palette = "nebula" | "ember" | "aurora";
type RGB = [number, number, number];

const PALETTES: Record<Palette, { bg: RGB; stops: RGB[] }> = {
  nebula: { bg: [4, 6, 18], stops: [[14, 34, 120], [40, 90, 230], [128, 70, 235], [235, 90, 200], [255, 190, 230]] },
  ember: { bg: [10, 4, 8], stops: [[70, 12, 40], [170, 40, 40], [245, 110, 40], [255, 190, 90], [255, 238, 190]] },
  aurora: { bg: [3, 9, 16], stops: [[8, 60, 90], [16, 150, 140], [40, 210, 150], [120, 120, 240], [190, 150, 255]] },
};

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const smooth = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
export function fbm(x: number, y: number, octaves = 5) {
  let sum = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const step = (a: number, b: number, v: number) => smooth(clamp((v - a) / (b - a)));

function ramp(stops: RGB[], t: number): RGB {
  const p = clamp(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const f = p - i;
  const a = stops[i], b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const cache = new Map<Palette, ImageData>();

/**
 * Paints a nebula from domain-warped fractal noise: a bright diagonal band (the "Milky Way"),
 * wispy gas coloured by a palette, and darker dust lanes carved on top.
 */
export function renderNebula(palette: Palette, width = 1024, height = 576): ImageData {
  const hit = cache.get(palette);
  if (hit) return hit;
  const { bg, stops } = PALETTES[palette];
  const image = new ImageData(width, height);
  const data = image.data;
  const scale = 3.2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width, ny = y / height;
      const u = nx * scale * (width / height) * 0.62, v = ny * scale;
      const qx = fbm(u, v), qy = fbm(u + 5.2, v + 1.3);
      const d = fbm(u + 3.6 * qx, v + 3.6 * qy);
      const lineY = 0.66 - 0.5 * (nx - 0.15);
      const dist = ny - lineY;
      const band = Math.exp(-(dist * dist) / 0.05);
      const gas = clamp((d - 0.28) * 2.1) * (0.18 + 1.0 * band);
      const hue = fbm(u * 0.8 + 9, v * 0.8 + 2, 3) * 0.7 + band * 0.45 + (qx - 0.5) * 0.5;
      const dust = step(0.5, 0.72, fbm(u * 2.1 + 3, v * 2.1, 4)) * band;
      const ridgeN = fbm(u * 1.9 + 2.4 * qy, v * 1.9 + 2.4 * qx, 4);
      const ridge = Math.pow(1 - Math.abs(2 * ridgeN - 1), 4) * (0.15 + band) * clamp((d - 0.2) * 3);
      const k = (Math.pow(gas, 1.25) * 1.15 + ridge * 0.9) * (1 - dust * 0.8);
      const [r, g, b] = ramp(stops, hue);
      const core = Math.pow(clamp(band * (d - 0.38) * 2.2), 2) * 38;
      const i = (y * width + x) * 4;
      data[i] = clamp(bg[0] + r * k + core, 0, 255);
      data[i + 1] = clamp(bg[1] + g * k + core * 0.9, 0, 255);
      data[i + 2] = clamp(bg[2] + b * k + core, 0, 255);
      data[i + 3] = 255;
    }
  }
  cache.set(palette, image);
  return image;
}
