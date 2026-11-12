/**
 * Draws real planet photographs (equirectangular NASA-based maps) as lit, rotating spheres
 * on a canvas — a tiny software "texture mapper" so no WebGL or 3D library is needed.
 */
const TAU = Math.PI * 2;
type Tex = ImageData;
const cache = new Map<string, Tex | "loading" | "error">();

/** Returns the decoded texture, or null while it is still loading (and starts loading it). */
export function texture(name: string): Tex | null {
  if (typeof document === "undefined") return null;
  const hit = cache.get(name);
  if (hit && hit !== "loading" && hit !== "error") return hit;
  if (!hit) {
    cache.set(name, "loading");
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext("2d")!;
      x.drawImage(img, 0, 0);
      cache.set(name, x.getImageData(0, 0, c.width, c.height));
    };
    img.onerror = () => cache.set(name, "error");
    img.src = `/planets/${name}.jpg`;
  }
  return null;
}

export type GlobeOptions = {
  rotation: number;
  /** Unit vector pointing to the light (screen space: x right, y down, z toward viewer). */
  light?: [number, number, number];
  ambient?: number;
  clouds?: Tex | null;
  cloudRotation?: number;
  /** Atmosphere rim colour [r,g,b]. */
  atmosphere?: [number, number, number];
};

export class Globe {
  private D = 0;
  private lon = new Float32Array(0);
  private v = new Float32Array(0);
  private nx = new Float32Array(0);
  private ny = new Float32Array(0);
  private nz = new Float32Array(0);
  private edge = new Float32Array(0);
  private image: ImageData | null = null;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
  }

  private build(D: number) {
    this.D = D;
    const n = D * D;
    this.lon = new Float32Array(n);
    this.v = new Float32Array(n);
    this.nx = new Float32Array(n);
    this.ny = new Float32Array(n);
    this.nz = new Float32Array(n);
    this.edge = new Float32Array(n);
    for (let j = 0; j < D; j++)
      for (let i = 0; i < D; i++) {
        const x = ((i + 0.5) / D) * 2 - 1;
        const y = ((j + 0.5) / D) * 2 - 1;
        const r = Math.hypot(x, y);
        const k = j * D + i;
        this.edge[k] = Math.min(1, Math.max(0, (1 - r) * D * 0.5));
        if (r >= 1) continue;
        const z = Math.sqrt(1 - r * r);
        this.nx[k] = x;
        this.ny[k] = y;
        this.nz[k] = z;
        this.lon[k] = Math.atan2(x, z);
        this.v[k] = 0.5 - Math.asin(-y) / Math.PI;
      }
    this.canvas.width = D;
    this.canvas.height = D;
    this.image = this.ctx.createImageData(D, D);
  }

  /** Renders to the internal canvas (size D×D) and returns it. */
  render(D: number, tex: Tex, o: GlobeOptions): HTMLCanvasElement {
    if (D !== this.D) this.build(D);
    const img = this.image!;
    const data = img.data;
    const [lx, ly, lz] = o.light ?? [-0.55, -0.4, 0.73];
    const ambient = o.ambient ?? 0.05;
    const { width: W, height: H, data: td } = tex;
    const cl = o.clouds;
    for (let k = 0; k < D * D; k++) {
      const e = this.edge[k];
      const p = k * 4;
      if (e <= 0) {
        data[p + 3] = 0;
        continue;
      }
      let u = (this.lon[k] + o.rotation) / TAU;
      u -= Math.floor(u);
      const t = ((this.v[k] * H) | 0) * W + ((u * W) | 0);
      let r = td[t * 4], g = td[t * 4 + 1], b = td[t * 4 + 2];
      if (cl) {
        let uc = (this.lon[k] + (o.cloudRotation ?? o.rotation)) / TAU;
        uc -= Math.floor(uc);
        const c = cl.data[(((this.v[k] * cl.height) | 0) * cl.width + ((uc * cl.width) | 0)) * 4] / 255;
        const a = c * 0.85;
        r += (255 - r) * a;
        g += (255 - g) * a;
        b += (255 - b) * a;
      }
      const dot = this.nx[k] * lx + this.ny[k] * ly + this.nz[k] * lz;
      let s = (dot + 0.12) / 0.62;
      s = s < 0 ? 0 : s > 1 ? 1 : s * s * (3 - 2 * s);
      const shade = ambient + (1 - ambient) * s;
      r *= shade;
      g *= shade;
      b *= shade;
      if (o.atmosphere) {
        const rim = Math.pow(1 - this.nz[k], 3) * (0.25 + 0.75 * s);
        r += o.atmosphere[0] * rim;
        g += o.atmosphere[1] * rim;
        b += o.atmosphere[2] * rim;
      }
      data[p] = r > 255 ? 255 : r;
      data[p + 1] = g > 255 ? 255 : g;
      data[p + 2] = b > 255 ? 255 : b;
      data[p + 3] = e * 255;
    }
    this.ctx.putImageData(img, 0, 0);
    return this.canvas;
  }
}

/** Planet names that have a texture in /public/planets. */
export const PLANET_TEXTURES = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"] as const;
