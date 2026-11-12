"use client";
import { useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { appById, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import type { Words } from "./i18n";

export type WindowState = {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  /** Tiled to half of the screen; x/y/width/height keep the floating geometry. */
  snap?: "left" | "right" | null;
};
export type SnapZone = "left" | "right" | "max";

export function snapBox(zone: "left" | "right" | "max", bounds: Bounds) {
  const height = Math.max(1, bounds.height - MENU_H - (DOCK_H - 12));
  if (zone === "max") return { left: 8, top: MENU_H, width: bounds.width - 16, height };
  const width = bounds.width / 2 - 12;
  return { left: zone === "left" ? 8 : bounds.width / 2 + 4, top: MENU_H, width, height };
}
export type Bounds = { width: number; height: number };
export const initialBounds: Bounds = { width: 1280, height: 800 };
export const MENU_H = 30;
export const DOCK_H = 100;

export function constrain(w: WindowState, bounds: Bounds): WindowState {
  const width = Math.min(Math.max(300, w.width), Math.max(1, bounds.width - 16));
  const height = Math.min(Math.max(240, w.height), Math.max(1, bounds.height - MENU_H - 24));
  return {
    ...w,
    width,
    height,
    x: Math.max(8, Math.min(w.x, bounds.width - width - 8)),
    y: Math.max(MENU_H + 4, Math.min(w.y, bounds.height - height - 20)),
  };
}

export function AppWindow({
  state,
  zIndex,
  active,
  bounds,
  t,
  children,
  update,
  focus,
  close,
  onSnapPreview,
}: {
  state: WindowState;
  zIndex: number;
  active: boolean;
  bounds: Bounds;
  t: Words;
  children: ReactNode;
  update: (patch: Partial<WindowState>) => void;
  focus: () => void;
  close: () => void;
  onSnapPreview: (zone: SnapZone | null) => void;
}) {
  const gesture = useRef<{ x: number; y: number; state: WindowState; resize: boolean; zone: SnapZone | null } | null>(null);
  const [dragging, setDragging] = useState(false);
  const w = constrain(state, bounds);
  const mobile = bounds.width < 640;
  const full = w.maximized || mobile;
  const meta = appById[w.id];
  const snapped = !full && !!w.snap;
  const box = snapped
    ? snapBox(w.snap!, bounds)
    : full
    ? {
        left: mobile ? 0 : 8,
        top: MENU_H,
        width: mobile ? bounds.width : bounds.width - 16,
        height: Math.max(1, bounds.height - MENU_H - (mobile ? 78 : DOCK_H - 12)),
      }
    : { left: w.x, top: w.y, width: w.width, height: w.height };
  const dx = bounds.width / 2 - (box.left + box.width / 2);
  const dy = bounds.height - (box.top + box.height / 2) - 30;

  function start(e: React.PointerEvent<HTMLElement>, resize = false) {
    if (full || (!resize && (e.target as HTMLElement).closest("button"))) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    let origin = w;
    if (snapped && !resize) {
      // dragging a tiled window pops it back out under the pointer
      origin = constrain({ ...w, snap: null, x: e.clientX - w.width / 2, y: e.clientY - 18 }, bounds);
      update(origin);
    }
    gesture.current = { x: e.clientX, y: e.clientY, state: origin, resize, zone: null };
    setDragging(true);
  }
  function move(e: React.PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g) return;
    const ddx = e.clientX - g.x;
    const ddy = e.clientY - g.y;
    if (!g.resize) {
      g.zone =
        e.clientY <= MENU_H + 6 ? "max" : e.clientX <= 10 ? "left" : e.clientX >= bounds.width - 10 ? "right" : null;
      onSnapPreview(g.zone);
    }
    update(
      constrain(
        g.resize
          ? { ...g.state, width: g.state.width + ddx, height: g.state.height + ddy }
          : { ...g.state, x: g.state.x + ddx, y: g.state.y + ddy },
        bounds,
      ),
    );
  }
  function end() {
    const zone = gesture.current?.zone;
    gesture.current = null;
    setDragging(false);
    onSnapPreview(null);
    if (zone === "max") update({ maximized: true, snap: null });
    else if (zone) update({ snap: zone });
  }

  return (
    <motion.section
      role="dialog"
      aria-label={t[w.id]}
      tabIndex={-1}
      inert={w.minimized}
      className={`os-window ${active ? "is-active" : ""} ${dragging ? "is-dragging" : ""} ${full || snapped ? "is-full" : ""}`}
      onPointerDown={focus}
      onFocusCapture={focus}
      style={{ ...box, zIndex, transformOrigin: "50% 60%" }}
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={
        w.minimized
          ? { opacity: 0, scale: 0.12, x: dx, y: dy, transitionEnd: { visibility: "hidden" } }
          : { opacity: 1, scale: 1, x: 0, y: 0, visibility: "visible" }
      }
      exit={{ opacity: 0, scale: 0.9, y: 14, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.9 }}
    >
      <div
        className="os-titlebar"
        onDoubleClick={() => update({ maximized: !w.maximized, snap: null })}
        onPointerDown={(e) => start(e)}
        onPointerMove={move}
        onPointerUp={end}
        onLostPointerCapture={end}
        onPointerCancel={end}
      >
        <div className="os-lights" role="group">
          <button className="os-light is-close" aria-label={t.close} onClick={close}>
            <X size={9} strokeWidth={3.2} />
          </button>
          <button className="os-light is-min" aria-label={t.minimize} onClick={() => update({ minimized: true })}>
            <Minus size={9} strokeWidth={3.2} />
          </button>
          <button
            className="os-light is-max"
            aria-label={w.maximized ? t.restore : t.maximize}
            aria-pressed={w.maximized}
            onClick={() => update({ maximized: !w.maximized, snap: null })}
          >
            <Plus size={9} strokeWidth={3.2} />
          </button>
        </div>
        <span className="os-title">
          <AppIcon src={meta.src} size={18} className="os-title-icon" />
          {t[w.id]}
        </span>
      </div>
      <div className="os-content">{children}</div>
      {!full && !snapped && (
        <button
          className="os-resize"
          aria-label={t.resize}
          onPointerDown={(e) => start(e, true)}
          onPointerMove={move}
          onPointerUp={end}
          onLostPointerCapture={end}
          onKeyDown={(e) => {
            const step: Record<string, [number, number]> = {
              ArrowRight: [20, 0],
              ArrowLeft: [-20, 0],
              ArrowDown: [0, 20],
              ArrowUp: [0, -20],
            };
            const d = step[e.key];
            if (!d) return;
            e.preventDefault();
            update(constrain({ ...w, width: w.width + d[0], height: w.height + d[1] }, bounds));
          }}
        />
      )}
    </motion.section>
  );
}
