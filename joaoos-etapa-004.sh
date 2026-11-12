#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
[ "$(git branch --show-current)" = 'feature/joaoos-desktop' ] || { echo 'Branch incorreta'; exit 1; }
[ -f public/wallpapers/joaoos-nebula.png ] || { echo 'Wallpaper ausente'; exit 1; }
[ -f src/app/joaoos/page.tsx ] || { echo 'Página ausente'; exit 1; }
mkdir -p .local-backups
backup=".local-backups/joaoos-004-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup"
cp src/app/joaoos/page.tsx "$backup/page.tsx"
if [ -e src/app/joaoos/Desktop.tsx ]; then echo 'Desktop.tsx já existe; interrompido'; exit 1; fi
cat > src/app/joaoos/Desktop.tsx <<'EOF'
"use client";

import { useState } from "react";
import { BriefcaseBusiness, Code2, Folder, Mail, Maximize2, Minus, Terminal, UserRound, X, ArrowLeft, Layers } from "lucide-react";
import { projects } from "@/data/projects";
import { technologies } from "@/data/technologies";
import { experience } from "@/data/experience";

export type Language = "pt" | "en" | "es";
type AppId = "projects" | "about" | "terminal" | "skills" | "career" | "contact";
type WindowState = { id: AppId; x: number; y: number; minimized: boolean; maximized: boolean; z: number };
const appIcons = { projects: Folder, about: UserRound, terminal: Terminal, skills: Code2, career: BriefcaseBusiness, contact: Mail };
const words = {
  pt: { projects: "Projetos", about: "Sobre mim", terminal: "Terminal", skills: "Tecnologias", career: "Experiência", contact: "Contato", back: "Bloquear", hint: "Terminal Java em desenvolvimento", intro: "Desenvolvedor de software com foco em Java, aplicações web e soluções digitais." },
  en: { projects: "Projects", about: "About me", terminal: "Terminal", skills: "Technologies", career: "Experience", contact: "Contact", back: "Lock", hint: "Java terminal in development", intro: "Software developer focused on Java, web applications and digital solutions." },
  es: { projects: "Proyectos", about: "Sobre mí", terminal: "Terminal", skills: "Tecnologías", career: "Experiencia", contact: "Contacto", back: "Bloquear", hint: "Terminal Java en desarrollo", intro: "Desarrollador de software enfocado en Java, aplicaciones web y soluciones digitales." }
};
const ids: AppId[] = ["projects", "about", "skills", "career", "terminal", "contact"];
export function Desktop({ language, onLock }: { language: Language; onLock: () => void }) {
  const t = words[language];
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [topZ, setTopZ] = useState(10);
  const [drag, setDrag] = useState<{ id: AppId; startX: number; startY: number; x: number; y: number } | null>(null);
  const open = (id: AppId) => {
    const z = topZ + 1; setTopZ(z);
    setWindows(current => current.some(w => w.id === id) ? current.map(w => w.id === id ? { ...w, minimized: false, z } : w) : [...current, { id, x: 90 + (current.length % 5) * 36, y: 90 + (current.length % 5) * 30, minimized: false, maximized: false, z }]);
  };
  const update = (id: AppId, patch: Partial<WindowState>) => setWindows(current => current.map(w => w.id === id ? { ...w, ...patch } : w));
  const focus = (id: AppId) => { const z = topZ + 1; setTopZ(z); update(id, { z }); };
  const content = (id: AppId) => {
    switch (id) {
      case "projects": return <div className="space-y-3">{projects.map(p => <div key={p.slug} className="rounded-xl bg-white/10 p-4"><strong>{p.title}</strong><p className="mt-1 text-sm text-white/70">{p.description}</p></div>)}</div>;
      case "about": return <p className="leading-7 text-white/80">{t.intro}</p>;
      case "skills": return <div className="flex flex-wrap gap-2">{technologies.map(s => <span key={s} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">{s}</span>)}</div>;
      case "career": return <div className="space-y-3">{experience.map(e => <div key={e.company} className="rounded-xl bg-white/10 p-4"><strong>{e.company}</strong><p>{e.role}</p><p className="text-sm text-white/60">{e.period}</p><p className="mt-2 text-sm text-white/70">{e.description}</p></div>)}</div>;
      case "terminal": return <div className="rounded-lg bg-black/75 p-4 font-mono text-sm"><p className="text-emerald-300">joao@joaoos:~$ java --version</p><p className="mt-2 text-white/70">{t.hint}</p><p className="mt-3 text-xs text-white/50">API Java será integrada em etapa posterior. Nenhum comando é executado.</p></div>;
      case "contact": return <div className="space-y-3"><a className="block underline" href="mailto:Joao.panucci@hotmail.com">Joao.panucci@hotmail.com</a><a className="block underline" href="https://github.com/joaopanucci" target="_blank" rel="noreferrer">GitHub</a><a className="block underline" href="https://www.linkedin.com/in/jaopanucci/" target="_blank" rel="noreferrer">LinkedIn</a></div>;
    }
  };
  return <div className="absolute inset-0 text-white" onPointerMove={e => { if (!drag) return; const x = Math.max(0, drag.x + e.clientX - drag.startX); const y = Math.max(42, drag.y + e.clientY - drag.startY); update(drag.id, { x, y }); }} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
    <header className="absolute inset-x-0 top-0 z-[100] flex h-12 items-center justify-between border-b border-white/15 bg-black/35 px-5 backdrop-blur-xl"><span className="font-semibold">JoãoOS</span><div className="flex items-center gap-4"><span className="text-xs text-white/70">{language.toUpperCase()}</span><button type="button" onClick={onLock} className="inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm hover:bg-white/15"><ArrowLeft size={15}/>{t.back}</button></div></header>
    <div className="absolute left-5 top-20 grid grid-cols-2 gap-3 sm:grid-cols-1">{ids.map(id => { const Icon = appIcons[id]; return <button key={id} type="button" onDoubleClick={() => open(id)} onClick={() => open(id)} className="flex w-24 flex-col items-center gap-2 rounded-xl p-2 text-center text-xs hover:bg-white/15"><span className="rounded-2xl border border-white/20 bg-slate-900/65 p-3 shadow-xl backdrop-blur"><Icon size={26}/></span>{t[id]}</button>; })}</div>
    {windows.filter(w => !w.minimized).map(w => <section key={w.id} aria-label={t[w.id]} onPointerDown={() => focus(w.id)} className="absolute flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#11172b]/95 shadow-2xl backdrop-blur-xl" style={{ left: w.maximized ? 8 : w.x, top: w.maximized ? 55 : w.y, width: w.maximized ? "calc(100% - 16px)" : "min(620px, calc(100vw - 24px))", height: w.maximized ? "calc(100% - 140px)" : "min(410px, calc(100dvh - 180px))", zIndex: w.z }}>
      <div className="flex h-12 shrink-0 touch-none items-center justify-between border-b border-white/10 bg-white/5 px-4" onPointerDown={e => { if (w.maximized || (e.target as HTMLElement).closest('button')) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag({ id: w.id, startX: e.clientX, startY: e.clientY, x: w.x, y: w.y }); focus(w.id); }}><span className="text-sm font-medium">{t[w.id]}</span><div className="flex gap-2"><button type="button" aria-label="Minimizar" onClick={() => update(w.id, { minimized: true })} className="rounded p-1 hover:bg-white/15"><Minus size={16}/></button><button type="button" aria-label="Maximizar" onClick={() => update(w.id, { maximized: !w.maximized })} className="rounded p-1 hover:bg-white/15"><Maximize2 size={15}/></button><button type="button" aria-label="Fechar" onClick={() => setWindows(current => current.filter(item => item.id !== w.id))} className="rounded p-1 hover:bg-red-500/50"><X size={16}/></button></div></div>
      <div className="min-h-0 flex-1 overflow-auto p-5">{content(w.id)}</div>
    </section>)}
    <nav aria-label="Aplicativos" className="absolute bottom-5 left-1/2 z-[101] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-2xl border border-white/25 bg-black/45 p-2 shadow-2xl backdrop-blur-2xl"><span className="mr-1 rounded-xl bg-white/10 p-2"><Layers size={22}/></span>{ids.map(id => { const Icon = appIcons[id]; const running = windows.some(w => w.id === id); return <button type="button" key={id} onClick={() => open(id)} title={t[id]} aria-label={t[id]} className="relative rounded-xl bg-white/10 p-3 transition hover:-translate-y-1 hover:bg-white/20"><Icon size={23}/>{running && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan-300"/>}</button>; })}</nav>
  </div>;
}
EOF
cat > src/app/joaoos/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Globe, LockKeyhole } from "lucide-react";
import { Desktop, type Language } from "./Desktop";

const translations = {
  pt: { greeting: "Conheça o mundo de João", intro: "Projetos, ideias e um pouco da minha trajetória.", enter: "Conheça o mundo de João" },
  en: { greeting: "Welcome to João's world", intro: "Projects, ideas and a little of my journey.", enter: "Explore João's world" },
  es: { greeting: "Bienvenido al mundo de João", intro: "Proyectos, ideas y un poco de mi trayectoria.", enter: "Conoce el mundo de João" }
};
function getSavedLanguage(): Language {
  if (typeof window === "undefined") return "pt";
  const saved = window.localStorage.getItem("joaoos-language");
  return saved === "en" || saved === "es" ? saved : "pt";
}
export default function JoaoOSPage() {
  const [language, setLanguage] = useState<Language>(getSavedLanguage);
  const [entered, setEntered] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const changeLanguage = (value: Language) => { setLanguage(value); window.localStorage.setItem("joaoos-language", value); };
  const t = translations[language];
  const locale = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-ES";
  return <div className="fixed inset-0 z-50 overflow-hidden bg-[#080d18] text-white">
    <div aria-hidden className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${entered ? "scale-100 blur-none" : "scale-105 blur-[3px]"}`} style={{ backgroundImage: "url('/wallpapers/joaoos-nebula.png')" }} />
    <div aria-hidden className="absolute inset-0 bg-black/45" />
    {!entered ? <div className="relative flex h-full min-h-0 flex-col items-center justify-between px-5 py-8 sm:py-10">
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/35 p-1.5 backdrop-blur-xl" aria-label="Idioma"><Globe size={16} className="mx-2" />{(["pt", "en", "es"] as const).map(value => <button key={value} type="button" onClick={() => changeLanguage(value)} aria-pressed={language === value} className={`rounded-full px-3 py-1 text-sm ${language === value ? "bg-white text-black" : "text-white/80 hover:bg-white/15"}`}>{value === "pt" ? "PT-BR" : value.toUpperCase()}</button>)}</div>
      <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center"><LockKeyhole size={20} className="text-white/75"/><div className="text-6xl font-light tabular-nums tracking-tight sm:text-8xl">{now ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(now) : "--:--"}</div><div className="text-sm text-white/80">{now ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now) : ""}</div><h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{t.greeting}</h1><p className="text-white/80">{t.intro}</p><button type="button" onClick={() => setEntered(true)} className="mt-2 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-6 py-3 font-medium backdrop-blur-xl transition hover:bg-white/25">{t.enter}<ArrowRight size={18}/></button></div>
      <div className="text-xs text-white/65">© {now?.getFullYear() ?? "2026"} João Panucci · JoãoOS</div>
    </div> : <Desktop language={language} onLock={() => setEntered(false)} />}
  </div>;
}
EOF
printf 'Backup: %s\nArquivos criados: src/app/joaoos/Desktop.tsx e page.tsx\n' "$backup"
if [ -x node_modules/.bin/eslint ]; then ./node_modules/.bin/eslint src/app/joaoos/page.tsx src/app/joaoos/Desktop.tsx; fi
if [ -x node_modules/.bin/tsc ]; then ./node_modules/.bin/tsc --noEmit; fi
