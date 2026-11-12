import type { LucideIcon } from "lucide-react";

/** macOS-style squircle icon: gradient, top gloss, inner border and soft shadow. */
export function AppIcon({
  icon: Icon,
  colors,
  size = 56,
  className = "",
}: {
  icon: LucideIcon;
  colors: [string, string];
  size?: number | string;
  className?: string;
}) {
  return (
    <span
      className={`os-appicon ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      <Icon strokeWidth={1.8} />
    </span>
  );
}
