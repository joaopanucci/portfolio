"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { apps, type AppMeta, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import type { Words } from "./i18n";

function DockItem({
  app,
  mouseX,
  base,
  max,
  label,
  running,
  dimmed,
  bouncing,
  onOpen,
}: {
  app: AppMeta;
  mouseX: MotionValue<number>;
  base: number;
  max: number;
  label: string;
  running: boolean;
  dimmed: boolean;
  bouncing: boolean;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (value) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? value - rect.x - rect.width / 2 : Infinity;
  });
  const mid = base + (max - base) * 0.45;
  const sized = useTransform(distance, [-170, -80, 0, 80, 170], [base, mid, max, mid, base]);
  const size = useSpring(sized, { mass: 0.1, stiffness: 170, damping: 13 });
  return (
    <div ref={ref} className="os-dock-slot">
      <motion.button
        className="os-dock-btn"
        aria-label={label}
        onClick={onOpen}
        style={{ width: size, height: size }}
        animate={bouncing ? { y: [0, -26, 0, -12, 0] } : { y: 0 }}
        transition={bouncing ? { duration: 0.9, ease: "easeOut" } : { duration: 0.2 }}
        whileTap={{ scale: 0.9 }}
      >
        <AppIcon icon={app.icon} colors={app.colors} size="100%" />
        <span className="os-dock-tip" aria-hidden>
          {label}
        </span>
      </motion.button>
      <span className={`os-dock-dot ${running ? "is-on" : ""} ${dimmed ? "is-dim" : ""}`} />
    </div>
  );
}

export function Dock({
  t,
  running,
  minimized,
  bouncing,
  magnify,
  compact,
  onOpen,
}: {
  t: Words;
  running: Set<AppId>;
  minimized: Set<AppId>;
  bouncing: AppId | null;
  magnify: boolean;
  compact: boolean;
  onOpen: (id: AppId) => void;
}) {
  const mouseX = useMotionValue(Infinity);
  const base = compact ? 40 : 54;
  const max = magnify && !compact ? 88 : base;
  return (
    <nav className="os-dock-wrap" aria-label={t.apps}>
      <motion.div
        className="os-dock"
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.15 }}
        onPointerMove={(e) => e.pointerType === "mouse" && mouseX.set(e.pageX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        style={{ height: max + 20 }}
      >
        {apps
          .filter((a) => a.dock)
          .map((app, i, list) => (
            <span key={app.id} className="contents">
              {i === list.length - 1 && <span className="os-dock-sep" aria-hidden />}
              <DockItem
                app={app}
                mouseX={mouseX}
                base={base}
                max={max}
                label={t[app.id]}
                running={running.has(app.id)}
                dimmed={minimized.has(app.id)}
                bouncing={bouncing === app.id}
                onOpen={() => onOpen(app.id)}
              />
            </span>
          ))}
      </motion.div>
    </nav>
  );
}
