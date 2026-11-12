"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { locales } from "../i18n";
import { planets } from "../planets";
import type { AppProps } from "./types";

const SIZE = 400;
const C = SIZE / 2;
// square-root scale keeps Mercury and Neptune on the same canvas
const radius = (au: number) => 26 + Math.sqrt(au) * 31;

export function PlanetariumApp({ t, language }: AppProps) {
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
          </defs>
          <circle cx={C} cy={C} r="22" fill="url(#pl-sun)" className="pl-sun" />
          {planets.map((p) => {
            const r = radius(p.au);
            const duration = 7 * Math.pow(p.years, 0.62);
            const active = p.id === selected;
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
                    <circle
                      cx={C + r}
                      cy={C}
                      r={p.id === "jupiter" || p.id === "saturn" ? 6.5 : p.id === "uranus" || p.id === "neptune" ? 5 : 3.6}
                      fill={p.color[0]}
                      stroke={p.color[1]}
                      strokeWidth="1.2"
                    />
                    {p.id === "saturn" && (
                      <ellipse cx={C + r} cy={C} rx="11" ry="3.2" className="pl-ring" transform={`rotate(-20 ${C + r} ${C})`} />
                    )}
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
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === selected}
              className={p.id === selected ? "is-sel" : ""}
              onClick={() => setSelected(p.id)}
            >
              <i style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${p.color[0]} 45%, ${p.color[1]})` }} />
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
                <dd>
                  {planet.years < 1
                    ? `${fmt(planet.years * 365.25)} ${t.unitDays}`
                    : `${fmt(planet.years)} ${t.unitYears}`}
                </dd>
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
