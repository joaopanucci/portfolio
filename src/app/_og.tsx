import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

// A small feed-forward network drawn as SVG: layers of neurons joined by weighted edges.
const LAYERS = [3, 5, 5, 2];
const W = 500, H = 500;
const px = (l: number) => 50 + (l / (LAYERS.length - 1)) * (W - 100);
const py = (l: number, i: number) => H / 2 + (i - (LAYERS[l] - 1) / 2) * 86;

export function renderOg() {
  const edges: { x1: number; y1: number; x2: number; y2: number; o: number; orange: boolean }[] = [];
  for (let l = 0; l < LAYERS.length - 1; l++)
    for (let i = 0; i < LAYERS[l]; i++)
      for (let j = 0; j < LAYERS[l + 1]; j++) {
        const k = (i * 7 + j * 13 + l * 5) % 10;
        edges.push({ x1: px(l), y1: py(l, i), x2: px(l + 1), y2: py(l + 1, j), o: 0.1 + k * 0.06, orange: k % 4 === 0 });
      }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          color: "#f1f5f9",
          background: "radial-gradient(circle at 78% 45%, #0b2a47 0%, #040b14 45%, #02050a 100%)",
        }}
      >
        <div style={{ position: "absolute", right: 40, top: 65, width: W, height: H, display: "flex" }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {edges.map((e, i) => (
              <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.orange ? "#ff9a3d" : "#22b8ff"} strokeOpacity={e.o} strokeWidth={e.o * 6} />
            ))}
            {LAYERS.flatMap((n, l) =>
              Array.from({ length: n }, (_, i) => (
                <g key={`${l}-${i}`}>
                  <circle cx={px(l)} cy={py(l, i)} r={26} fill="#22b8ff" fillOpacity={0.12} />
                  <circle cx={px(l)} cy={py(l, i)} r={14} fill={(l + i) % 3 === 0 ? "#ff9a3d" : "#22b8ff"} />
                  <circle cx={px(l)} cy={py(l, i)} r={6} fill="#ffffff" />
                </g>
              )),
            )}
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 80px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="54" height="54" viewBox="0 0 64 64">
              <g stroke="#22b8ff" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M26 22V10M32 22V7M38 22V10M26 42V54M32 42V57M38 42V54M22 26H10M22 32H7M22 38H10M42 26H54M42 32H57M42 38H54" />
              </g>
              <rect x="21" y="21" width="22" height="22" rx="4" fill="#07263f" stroke="#22b8ff" strokeWidth="3" />
              <rect x="27" y="27" width="10" height="10" rx="2" fill="#22b8ff" />
            </svg>
            <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: "#7f9bb8", textTransform: "uppercase" }}>JoãoOS · Neural Edition</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>João Panucci</div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 40, color: "#cbd5e1" }}>Software Developer</div>
            <div style={{ display: "flex", marginTop: 34, gap: 14 }}>
              {["Java", "Spring Boot", "React", "Xadrez"].map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "8px 22px",
                    fontSize: 26,
                    borderRadius: 99,
                    color: "#e2e8f0",
                    background: "rgba(34,184,255,0.1)",
                    border: "1px solid rgba(34,184,255,0.35)",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 28, color: "#7f9bb8" }}>Java, produtos digitais e uma partida de xadrez · joaopanucci.com</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
