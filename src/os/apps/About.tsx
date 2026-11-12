"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BriefcaseBusiness, Code2, UserRound } from "lucide-react";
import { techGroups } from "../catalog";
import type { AppProps } from "./types";

const sections = [
  { id: "profile", icon: UserRound, key: "aboutProfile" },
  { id: "career", icon: BriefcaseBusiness, key: "aboutCareer" },
  { id: "tech", icon: Code2, key: "aboutTech" },
] as const;

export function AboutApp({ t }: AppProps) {
  const [section, setSection] = useState<(typeof sections)[number]["id"]>("profile");
  return (
    <div className="os-split">
      <aside className="os-sidebar" aria-label={t.about}>
        {sections.map(({ id, icon: Icon, key }) => (
          <button key={id} className={section === id ? "is-sel" : ""} onClick={() => setSection(id)}>
            <Icon size={16} />
            {t[key]}
          </button>
        ))}
      </aside>
      <div className="os-pane">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {section === "profile" && (
              <div>
                <div className="os-profile-head">
                  <motion.div
                    className="os-avatar is-big"
                    aria-hidden
                    initial={{ scale: 0.6, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                  >
                    JP
                  </motion.div>
                  <div>
                    <h2>João Panucci</h2>
                    <p className="os-muted">{t.role}</p>
                  </div>
                </div>
                <p className="os-lead">{t.bio}</p>
                <div className="os-stats">
                  <div>
                    <small>{t.focus}</small>
                    <b>{t.focusValue}</b>
                  </div>
                  <div>
                    <small>{t.now}</small>
                    <b>{t.nowValue}</b>
                  </div>
                </div>
              </div>
            )}
            {section === "career" && (
              <ol className="os-career">
                <li>
                  <span className="dot" />
                  <div className="os-card">
                    <div className="os-card-top">
                      <h3>SES/MS</h3>
                      <span className="os-badge">{t.careerPeriod}</span>
                    </div>
                    <p className="os-muted">{t.careerRole}</p>
                    <p>{t.careerIntro}</p>
                  </div>
                </li>
              </ol>
            )}
            {section === "tech" && (
              <div className="space-y-5">
                {Object.entries(techGroups).map(([key, list], g) => (
                  <div key={key}>
                    <h3 className="os-h3">{t[key as keyof typeof techGroups]}</h3>
                    <div className="os-chips">
                      {list.map((name, i) => (
                        <motion.span
                          key={name}
                          className="os-chip"
                          initial={{ opacity: 0, scale: 0.8, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: g * 0.08 + i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                          whileHover={{ y: -3, scale: 1.05 }}
                        >
                          {name}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
