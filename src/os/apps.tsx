import type { Words } from "./i18n";
import type { Project } from "./catalog";

export type AppId = "about" | "projects" | "chess" | "nyron" | "terminal" | "contact" | "settings";

export type AppMeta = {
  id: AppId;
  src: string;
  size: [number, number];
  dock: boolean;
};

export const apps: AppMeta[] = [
  { id: "about", src: "/icons/yaru/about.png", size: [760, 520], dock: true },
  { id: "projects", src: "/icons/yaru/projects.png", size: [860, 540], dock: true },
  { id: "chess", src: "/icons/yaru/chess.svg", size: [980, 700], dock: true },
  { id: "nyron", src: "/icons/yaru/nyron.png", size: [940, 600], dock: true },
  { id: "terminal", src: "/icons/yaru/terminal.png", size: [700, 450], dock: true },
  { id: "contact", src: "/icons/yaru/contact.png", size: [560, 420], dock: true },
  { id: "settings", src: "/icons/yaru/settings.png", size: [660, 480], dock: true },
];

export const appById = Object.fromEntries(apps.map((a) => [a.id, a])) as Record<AppId, AppMeta>;
export const appTitle = (id: AppId, t: Words) => t[id];

export const projectIcons: Record<Project["icon"], string> = {
  box: "/projects/autodock.png",
  cpu: "/icons/yaru/engine.png",
  building: "/projects/jelch.svg",
  heart: "/projects/saps.png",
  pin: "/projects/dakiali.svg",
  globe: "/projects/dakiali.svg",
};
