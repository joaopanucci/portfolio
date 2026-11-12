import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

const star = "M32 4 L37.5 26.5 L60 32 L37.5 37.5 L32 60 L26.5 37.5 L4 32 L26.5 26.5 Z";

/** Social share card: the cosmic desktop idea in a single frame. */
export function renderOg() {
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
          background: "linear-gradient(135deg, #04060f 0%, #0b1030 55%, #1a0f3d 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background: "radial-gradient(circle at 78% 36%, rgba(139,92,246,0.42) 0%, rgba(59,130,246,0.16) 32%, rgba(0,0,0,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 70,
            width: 490,
            height: 490,
            display: "flex",
            borderRadius: 490,
            border: "2px solid rgba(255,255,255,0.14)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 160,
            top: 140,
            width: 350,
            height: 350,
            display: "flex",
            borderRadius: 350,
            border: "2px dashed rgba(255,255,255,0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 235,
            top: 215,
            width: 200,
            height: 200,
            display: "flex",
            borderRadius: 200,
            background: "radial-gradient(circle, #fff7d6 0%, #ffb347 28%, rgba(255,120,30,0.55) 55%, rgba(255,90,20,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 560,
            top: 330,
            width: 22,
            height: 22,
            display: "flex",
            borderRadius: 22,
            background: "#67e8f9",
            boxShadow: "0 0 24px #67e8f9",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 470,
            width: 16,
            height: 16,
            display: "flex",
            borderRadius: 16,
            background: "#fb7185",
            boxShadow: "0 0 20px #fb7185",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 80px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="54" height="54" viewBox="0 0 64 64">
              <path d={star} fill="#ffffff" />
            </svg>
            <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: "#9aa6c4", textTransform: "uppercase" }}>
              JoãoOS · Universe Edition
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>João Panucci</div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 40, color: "#cbd5e1" }}>Software Developer</div>
            <div style={{ display: "flex", marginTop: 34, gap: 14 }}>
              {["Java", "Spring Boot", "React", "Nyron Engine"].map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "8px 22px",
                    fontSize: 26,
                    borderRadius: 99,
                    color: "#e2e8f0",
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 28, color: "#9aa6c4" }}>Do Big Bang ao código · joaopanucci.com</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
