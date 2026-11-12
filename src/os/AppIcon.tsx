/* Ubuntu "Yaru" icon (CC BY-SA 4.0, see public/icons/yaru). */
export function AppIcon({
  src,
  size = 56,
  className = "",
}: {
  src: string;
  size?: number | string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={256} height={256} draggable={false} className={`os-appicon ${className}`} style={{ width: size, height: size }} />
  );
}
