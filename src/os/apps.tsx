import {
  Box,
  Building2,
  Cpu,
  Globe,
  HeartPulse,
  MapPin,
  Orbit,
  Rocket,
  SquareTerminal,
  AtSign,
  UserRound,
  Settings,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";
import type { Words } from "./i18n";
import type { Project } from "./catalog";

export type AppId = "about" | "projects" | "cosmos" | "nyron" | "terminal" | "contact" | "settings";

export type AppMeta = {
  id: AppId;
  icon: LucideIcon;
  colors: [string, string];
  size: [number, number];
  dock: boolean;
};

export const apps: AppMeta[] = [
  { id: "about", icon: UserRound, colors: ["#60a5fa", "#2563eb"], size: [760, 520], dock: true },
  { id: "projects", icon: FolderKanban, colors: ["#38bdf8", "#6366f1"], size: [860, 540], dock: true },
  { id: "cosmos", icon: Orbit, colors: ["#8b5cf6", "#1e1b4b"], size: [780, 620], dock: true },
  { id: "nyron", icon: Rocket, colors: ["#fb923c", "#dc2626"], size: [940, 600], dock: true },
  { id: "terminal", icon: SquareTerminal, colors: ["#334155", "#020617"], size: [700, 450], dock: true },
  { id: "contact", icon: AtSign, colors: ["#34d399", "#0d9488"], size: [560, 420], dock: true },
  { id: "settings", icon: Settings, colors: ["#94a3b8", "#475569"], size: [660, 480], dock: true },
];

export const appById = Object.fromEntries(apps.map((a) => [a.id, a])) as Record<AppId, AppMeta>;
export const appTitle = (id: AppId, t: Words) => t[id];

export const projectIcons: Record<Project["icon"], LucideIcon> = {
  box: Box,
  cpu: Cpu,
  building: Building2,
  heart: HeartPulse,
  pin: MapPin,
  globe: Globe,
};
