"use client";
import { motion } from "motion/react";
import { Copy, ExternalLink } from "lucide-react";
import { AppIcon } from "../AppIcon";
import { publicLinks } from "../catalog";
import type { AppProps } from "./types";

export function ContactApp({ t, toast }: AppProps) {
  const rows = [
    { src: "/icons/yaru/contact.png", label: "E-mail", value: publicLinks.email, href: `mailto:${publicLinks.email}` },
    { src: "/icons/yaru/engine.png", label: "GitHub", value: "github.com/joaopanucci", href: publicLinks.github },
    { src: "/icons/yaru/about.png", label: "LinkedIn", value: "linkedin.com/in/jaopanucci", href: publicLinks.linkedin },
    { src: "/icons/yaru/chat.png", label: "Discord · AutoDock", value: t.community, href: publicLinks.discord },
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
              <AppIcon src={row.src} size={40} />
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
