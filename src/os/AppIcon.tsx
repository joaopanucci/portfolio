/* App images: Ubuntu "Yaru" icons (CC BY-SA 4.0, see public/icons/yaru) and the projects' own logos. */
const LIGHT_TILE = ["/projects/saps.png", "/projects/jelch.svg"];

export function AppIcon({
  src,
  size = 56,
  className = "",
}: {
  src: string;
  size?: number | string;
  className?: string;
}) {
  const tile = LIGHT_TILE.includes(src);
  return (
    <span className={`os-appicon ${tile ? "is-tile" : ""} ${className}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} />
    </span>
  );
}
