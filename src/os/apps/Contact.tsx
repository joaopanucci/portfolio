"use client";
import { motion } from "motion/react";
import { AtSign, Code2, Copy, ExternalLink, MessageCircle, Network } from "lucide-react";
import { publicLinks } from "../catalog";
import type { AppProps } from "./types";

export function ContactApp({ t, toast }: AppProps) {
  const rows = [
    { icon: AtSign, label: "E-mail", value: publicLinks.email, href: `mailto:${publicLinks.email}`, colors: ["#60a5fa", "#2563eb"] },
    { icon: Code2, label: "GitHub", value: "github.com/joaopanucci", href: publicLinks.github, colors: ["#94a3b8", "#334155"] },
    { icon: Network, label: "LinkedIn", value: "linkedin.com/in/jaopanucci", href: publicLinks.linkedin, colors: ["#38bdf8", "#0369a1"] },
    { icon: MessageCircle, label: "Discord · AutoDock", value: t.community, href: publicLinks.discord, colors: ["#818cf8", "#4f46e5"] },
  ];
  return (
    <div className="os-pane os-contact">
      <h2>{t.contactIntro}</h2>
      <ul>
        {rows.map((row, i) => (
          <motion.li
            key={row.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 26 }}
          >
            <a href={row.href} target={row.href.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer">
              <span className="os-appicon" style={{ width: 38, height: 38, background: `linear-gradient(160deg, ${row.colors[0]}, ${row.colors[1]})` }}>
                <row.icon strokeWidth={1.8} />
              </span>
              <span className="os-contact-text">
                <b>{row.label}</b>
                <small>{row.value}</small>
              </span>
              <ExternalLink size={15} className="os-muted" aria-hidden />
            </a>
            {row.label === "E-mail" && (
              <button
                className="os-btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicLinks.email);
                    toast(t.copied, publicLinks.email);
                  } catch {
                    toast(publicLinks.email);
                  }
                }}
              >
                <Copy size={14} />
                {t.copyEmail}
              </button>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
