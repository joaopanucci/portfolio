import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0a1a2e, #02050a)" }}>
        <svg width="150" height="150" viewBox="0 0 64 64">
          <g stroke="#22b8ff" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M26 22V12M32 22V9M38 22V12M26 42V52M32 42V55M38 42V52M22 26H12M22 32H9M22 38H12M42 26H52M42 32H55M42 38H52" />
          </g>
          <rect x="21" y="21" width="22" height="22" rx="4" fill="#07263f" stroke="#22b8ff" strokeWidth="2.6" />
          <rect x="27" y="27" width="10" height="10" rx="2" fill="#22b8ff" />
        </svg>
      </div>
    ),
    size,
  );
}
