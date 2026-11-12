import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1b1f4a, #05060f)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 150,
            height: 150,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 150,
            background: "radial-gradient(circle, rgba(255,190,90,0.7) 0%, rgba(255,120,30,0) 70%)",
          }}
        >
          <svg width="112" height="112" viewBox="0 0 64 64">
            <path d="M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z" fill="#ffffff" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
