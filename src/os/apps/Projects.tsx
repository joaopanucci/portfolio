"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Layers, Wrench, Building2, Landmark, Rocket } from "lucide-react";
import { projectIcons } from "../apps";
import { AppIcon } from "../AppIcon";
import { projects, type Project, type ProjectId } from "../catalog";
import type { AppProps } from "./types";

const filters = [
  { id: "all", icon: Layers, key: "projectsAll" },
  { id: "tools", icon: Wrench, key: "projectsTools" },
  { id: "companies", icon: Building2, key: "projectsCompanies" },
  { id: "institutional", icon: Landmark, key: "projectsInstitutional" },
] as const;

export function ProjectsApp({ t, arg, openApp }: AppProps) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [selected, setSelected] = useState<ProjectId | null>(null);
  const [seenNonce, setSeenNonce] = useState(0);

  // Deep link from Spotlight: adjust state while rendering instead of in an effect.
  if (arg && arg.nonce !== seenNonce) {
    setSeenNonce(arg.nonce);
    if (projects.some((p) => p.id === arg.value)) {
      setFilter("all");
      setSelected(arg.value as ProjectId);
    }
  }

  const list = projects.filter((p) => filter === "all" || p.category === filter);
  const current = projects.find((p) => p.id === selected) ?? null;

  return (
    <div className="os-split">
      <aside className="os-sidebar" aria-label={t.projects}>
        {filters.map(({ id, icon: Icon, key }) => (
          <button key={id} className={filter === id ? "is-sel" : ""} onClick={() => setFilter(id)}>
            <Icon size={16} />
            {t[key]}
          </button>
        ))}
      </aside>
      <div className="os-pane os-projects">
        <div className="os-grid">
          {list.map((p, i) => {
            const Icon = projectIcons[p.icon];
            return (
              <motion.button
                key={p.id}
                layout
                className={`os-tile ${selected === p.id ? "is-sel" : ""}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(p.id)}
              >
                <AppIcon icon={Icon} colors={p.colors} size={64} />
                <b>{p.title}</b>
                {p.badge && <small>{t[p.badge]}</small>}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {current ? (
            <Detail key={current.id} p={current} t={t} openApp={openApp} />
          ) : (
            <motion.p key="empty" className="os-muted os-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {t.projectsEmpty}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Detail({ p, t, openApp }: { p: Project; t: AppProps["t"]; openApp: AppProps["openApp"] }) {
  const Icon = projectIcons[p.icon];
  return (
    <motion.article
      className="os-detail"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      style={{ "--c1": p.colors[0], "--c2": p.colors[1] } as React.CSSProperties}
    >
      <div className="os-detail-head">
        <AppIcon icon={Icon} colors={p.colors} size={48} />
        <div>
          <h2>{p.title}</h2>
          {p.badge && <span className="os-badge">{t[p.badge]}</span>}
        </div>
      </div>
      <p className="os-lead">{t[p.descKey]}</p>
      {p.stack.length > 0 && (
        <>
          <h3 className="os-h3">{t.stack}</h3>
          <div className="os-chips">
            {p.stack.map((s) => (
              <span className="os-chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="os-actions">
        {p.id === "nyron" && (
          <button className="os-btn is-primary" onClick={() => openApp("nyron")}>
            <Rocket size={15} />
            {t.openLab}
          </button>
        )}
        {p.links.map((link) => (
          <a key={link.href} className="os-btn" href={link.href} target="_blank" rel="noreferrer">
            {link.kind === "github" ? "GitHub" : link.kind === "community" ? t.community : t.visit}
            <ExternalLink size={14} />
          </a>
        ))}
      </div>
    </motion.article>
  );
}
