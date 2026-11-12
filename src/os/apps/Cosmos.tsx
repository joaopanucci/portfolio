"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { projectIcons } from "../apps";
import { AppIcon } from "../AppIcon";
import { projects } from "../catalog";
import { cosmicDate, eras, type Era } from "../timeline";
import type { Language, Words } from "../i18n";
import type { AppProps } from "./types";

function EraCard({
  era,
  index,
  language,
  t,
  root,
  onActive,
  openApp,
}: {
  era: Era;
  index: number;
  language: Language;
  t: Words;
  root: React.RefObject<HTMLDivElement | null>;
  onActive: (i: number) => void;
  openApp: AppProps["openApp"];
}) {
  const copy = era.text[language];
  const cal = cosmicDate(era.ago, language);
  const last = era.id === "now";
  return (
    <motion.li
      id={`era-${era.id}`}
      className="os-era"
      initial={{ opacity: 0, x: 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ root, margin: "0px 0px -12% 0px", once: true }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      style={{ "--c1": era.colors[0], "--c2": era.colors[1] } as React.CSSProperties}
    >
      <motion.span
        className="os-orb"
        aria-hidden
        onViewportEnter={() => onActive(index)}
        viewport={{ root, margin: "-42% 0px -42% 0px" }}
        whileInView={{ scale: [0.6, 1.25, 1] }}
        transition={{ duration: 0.7 }}
      />
      <div className="os-era-card">
        <div className="os-era-meta">
          <span>{copy.when}</span>
          <em>
            {t.cosmicYear} · {cal.date} {cal.time}
          </em>
        </div>
        <h3>{copy.title}</h3>
        <p>{copy.body}</p>
        {last && (
          <div className="os-constellation">
            <h4>{t.constellation}</h4>
            <p>{t.constellationBody}</p>
            <div>
              {projects.map((p, i) => (
                <motion.button
                  key={p.id}
                  title={p.title}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ root, once: true }}
                  transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 260, damping: 14 }}
                  whileHover={{ y: -4, scale: 1.1 }}
                  onClick={() => openApp("projects", p.id)}
                >
                  <AppIcon icon={projectIcons[p.icon]} colors={p.colors} size={44} />
                  <span>{p.title}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.li>
  );
}

export function CosmosApp({ t, language, arg, openApp }: AppProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ container: scroller });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const era = eras[active];
  const cal = cosmicDate(era.ago, language);

  useEffect(() => {
    if (!arg) return;
    const target = scroller.current?.querySelector<HTMLElement>(`#era-${CSS.escape(arg.value)}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [arg]);

  return (
    <div
      className="os-cosmos"
      style={{ "--c1": era.colors[0], "--c2": era.colors[1] } as React.CSSProperties}
    >
      <header className="os-cosmos-head">
        <div>
          <h2>{t.cosmosTitle}</h2>
          <p>{t.cosmosSubtitle}</p>
        </div>
        <div className="os-calendar" role="img" aria-label={`${t.cosmicYear}: ${cal.date} ${cal.time}`}>
          <div className="os-calendar-bar">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
            <motion.b
              className="marker"
              animate={{ left: `${cal.progress * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="os-calendar-label">
            <span>{t.cosmicYear}</span>
            <b>
              {cal.date} · {cal.time}
            </b>
          </div>
        </div>
      </header>

      <div className="os-cosmos-scroll" ref={scroller}>
        <div className="os-timeline">
          <div className="os-rail" aria-hidden>
            <motion.i style={{ scaleY: fill }} />
          </div>
          <ol>
            {eras.map((e, i) => (
              <EraCard
                key={e.id}
                era={e}
                index={i}
                language={language}
                t={t}
                root={scroller}
                onActive={setActive}
                openApp={openApp}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
