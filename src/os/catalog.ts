import type { Words } from "./i18n";

export type ProjectId = "dakiali" | "jelch" | "autodock" | "nyron" | "saps";

export type Project = {
  id: ProjectId;
  title: string;
  category: "tools" | "companies" | "institutional";
  badge?: "private" | "source" | "production" | "inDevelopment";
  stack: string[];
  colors: [string, string];
  icon: "box" | "cpu" | "building" | "heart" | "pin" | "globe";
  links: { kind: "visit" | "community" | "github"; href: string }[];
  descKey: keyof Pick<Words, "dakiali" | "jelch" | "autodock" | "nyronDesc" | "saps">;
};

export const publicLinks = {
  github: "https://github.com/joaopanucci",
  repo: "https://github.com/joaopanucci/portfolio",
  autodock: "https://github.com/joaopanucci/autodock",
  discord: "https://discord.gg/UuJ7RrFC6E",
  linkedin: "https://www.linkedin.com/in/jaopanucci/",
  email: "Joao.panucci@hotmail.com",
};

export const projects: Project[] = [
  {
    id: "nyron",
    title: "Nyron Engine",
    category: "tools",
    badge: "inDevelopment",
    stack: ["Java"],
    colors: ["#a78bfa", "#6366f1"],
    icon: "cpu",
    links: [],
    descKey: "nyronDesc",
  },
  {
    id: "autodock",
    title: "AutoDock",
    category: "tools",
    badge: "source",
    stack: ["Docker"],
    colors: ["#38bdf8", "#2563eb"],
    icon: "box",
    links: [
      { kind: "github", href: publicLinks.autodock },
      { kind: "community", href: publicLinks.discord },
    ],
    descKey: "autodock",
  },
  {
    id: "dakiali",
    title: "Dakiali",
    category: "companies",
    badge: "private",
    stack: ["Java", "Spring Boot", "PostgreSQL", "React Native", "Vue"],
    colors: ["#f472b6", "#db2777"],
    icon: "pin",
    links: [{ kind: "visit", href: "https://dakiali.com" }],
    descKey: "dakiali",
  },
  {
    id: "jelch",
    title: "JELCH Group",
    category: "companies",
    stack: [],
    colors: ["#fbbf24", "#d97706"],
    icon: "building",
    links: [{ kind: "visit", href: "https://jelchgroup.com" }],
    descKey: "jelch",
  },
  {
    id: "saps",
    title: "SAPS",
    category: "institutional",
    badge: "production",
    stack: ["Java", "Spring Boot", "React", "TypeScript", "PostgreSQL", "Docker"],
    colors: ["#34d399", "#059669"],
    icon: "heart",
    links: [{ kind: "visit", href: "https://saps.saude.ms.gov.br" }],
    descKey: "saps",
  },
];

export const techGroups = {
  techBackend: ["Java", "Spring Boot", "PHP", "Laravel"],
  techFrontend: ["React", "TypeScript", "JavaScript"],
  techData: ["PostgreSQL", "MySQL", "Docker", "Git"],
} as const;
