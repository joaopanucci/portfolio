"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Globe, texture } from "../globe";
import { locales } from "../i18n";
import { planets, type Planet } from "../planets";
import type { AppProps } from "./types";

const SIZE = 400;
const C = SIZE / 2;
// square-root scale keeps Mercury and Neptune on the same canvas
const radius = (au: number) => 26 + Math.sqrt(au) * 31;
const bodyR: Record<string, number> = { mercury: 4.5, venus: 6, earth: 6.5, mars: 5, jupiter: 11, saturn: 9.5, uranus: 7.5, neptune: 7.5 };
const ATMOSPHERE: Record<string, [number, number, number]> = { earth: [70, 130, 255], venus: [90, 70, 20] };

/** A rotating, lit photo-sphere of the selected planet. */
function PlanetGlobe({ planet, reduced }: { planet: Planet; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 160;
    const pad = planet.id === "saturn" ? 44 : 8;
    el.width = (size + pad * 2) * dpr;
    el.height = size * dpr;
    el.style.width = `${size + pad * 2}px`;
    el.style.height = `${size}px`;
    const globe = new Globe();
    const D = Math.round(size * dpr);
    let raf = 0;
    const draw = (t: number) => {
      const tex = texture(planet.id);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      if (tex) {
        const R = (size / 2) * dpr * (planet.id === "saturn" ? 0.62 : 1);
        const cx = el.width / 2, cy = el.height / 2;
        const ring = (front: boolean) => {
          if (planet.id !== "saturn") return;
          [[1.55, 0.2, "rgba(220,196,150,0.75)", 7], [1.95, 0.5, "rgba(190,168,128,0.5)", 11], [2.35, 0.2, "rgba(210,186,140,0.35)", 4]].forEach(([k, , col, lw]) => {
            ctx.strokeStyle = col as string;
            ctx.lineWidth = (lw as number) * dpr * 0.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, R * (k as number), R * (k as number) * 0.28, -0.32, front ? 0 : Math.PI, front ? Math.PI : TAU);
            ctx.stroke();
          });
        };
        const TAU = Math.PI * 2;
        ring(false);
        const img = globe.render(Math.round(R * 2), tex, {
          rotation: reduced ? 1.2 : t * 0.0001,
          light: [-0.65, -0.25, 0.7],
          ambient: 0.07,
          clouds: planet.id === "earth" ? texture("earth_clouds") : null,
          cloudRotation: reduced ? 1.3 : t * 0.00014,
          atmosphere: ATMOSPHERE[planet.id],
        });
        ctx.drawImage(img, cx - R, cy - R, R * 2, R * 2);
        ring(true);
        void D;
      }
      if (!reduced || !tex) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [planet, reduced]);
  return <canvas ref={ref} className="os-planet-globe" aria-hidden />;
}

export function PlanetariumApp({ t, language, reduced }: AppProps) {
  const [selected, setSelected] = useState("earth");
  const planet = planets.find((p) => p.id === selected)!;
  const fmt = (n: number) => n.toLocaleString(locales[language], { maximumFractionDigits: 2 });
  const copy = planet.text[language];

  return (
    <div className="os-planet">
      <div className="os-planet-sky">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label={t.planetarium}>
          <defs>
            <radialGradient id="pl-sun">
              <stop offset="0" stopColor="#fff7d6" />
              <stop offset="0.45" stopColor="#ffb347" />
              <stop offset="1" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>
            {planets.map((p) => (
              <clipPath key={p.id} id={`clip-${p.id}`}>
                <circle cx={C + radius(p.au)} cy={C} r={bodyR[p.id]} />
              </clipPath>
            ))}
          </defs>
          <circle cx={C} cy={C} r="22" fill="url(#pl-sun)" className="pl-sun" />
          {planets.map((p) => {
            const r = radius(p.au);
            const duration = 7 * Math.pow(p.years, 0.62);
            const active = p.id === selected;
            const br = bodyR[p.id];
            return (
              <g key={p.id}>
                <circle cx={C} cy={C} r={r} className={`pl-orbit ${active ? "is-active" : ""}`} />
                <g className="pl-spin" style={{ animationDuration: `${duration}s` }}>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={p.text[language].name}
                    aria-pressed={active}
                    className={`pl-body ${active ? "is-active" : ""}`}
                    onClick={() => setSelected(p.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(p.id)}
                  >
                    <circle cx={C + r} cy={C} r="13" fill="transparent" />
                    <image
                      href={`/planets/${p.id}.jpg`}
                      x={C + r - br * 2.2}
                      y={C - br}
                      width={br * 4.4}
                      height={br * 2}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#clip-${p.id})`}
                    />
                    <circle cx={C + r} cy={C} r={br} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                    {p.id === "saturn" && <ellipse cx={C + r} cy={C} rx={br * 1.9} ry={br * 0.55} className="pl-ring" transform={`rotate(-20 ${C + r} ${C})`} />}
                  </g>
                </g>
              </g>
            );
          })}
        </svg>
        <p className="os-planet-note">{t.planetNote}</p>
      </div>

      <div className="os-planet-side">
        <div className="os-planet-list" role="listbox" aria-label={t.planetarium}>
          {planets.map((p) => (
            <button key={p.id} role="option" aria-selected={p.id === selected} className={p.id === selected ? "is-sel" : ""} onClick={() => setSelected(p.id)}>
              <i style={{ backgroundImage: `url(/planets/${p.id}.jpg)` }} />
              {p.text[language].name}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.article
            key={planet.id}
            className="os-planet-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{ "--c1": planet.color[0], "--c2": planet.color[1] } as React.CSSProperties}
          >
            <PlanetGlobe planet={planet} reduced={reduced} />
            <h2>{copy.name}</h2>
            <p>{copy.note}</p>
            <dl>
              <div>
                <dt>{t.planetDistance}</dt>
                <dd>
                  {fmt(planet.au)} {t.unitAu}
                </dd>
              </div>
              <div>
                <dt>{t.planetYear}</dt>
                <dd>{planet.years < 1 ? `${fmt(planet.years * 365.25)} ${t.unitDays}` : `${fmt(planet.years)} ${t.unitYears}`}</dd>
              </div>
              <div>
                <dt>{t.planetDiameter}</dt>
                <dd>
                  {fmt(planet.km)} {t.unitKm}
                </dd>
              </div>
            </dl>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}
