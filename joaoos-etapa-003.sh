#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
if [[ ! -f package.json || ! -f public/wallpapers/joaoos-nebula.png ]]; then echo 'Projeto ou wallpaper não encontrado'; exit 1; fi
if [[ "$(git branch --show-current)" == main ]]; then
  git switch -c feature/joaoos-desktop
fi
mkdir -p src/app/joaoos
if [[ -e src/app/joaoos/page.tsx ]]; then echo 'Rota já existe; nenhuma alteração feita'; exit 1; fi
cat > src/app/joaoos/page.tsx <<'TSX'
"use client";

import { useEffect, useState } from "react";
import { Globe, LockKeyhole, ArrowRight, ArrowLeft, Folder, Terminal, UserRound } from "lucide-react";

type Language = "pt" | "en" | "es";
const translations = {
  pt: { greeting: "Conheça o mundo de João", intro: "Projetos, ideias e um pouco da minha trajetória.", enter: "Conheça o mundo de João", back: "Voltar", projects: "Projetos", about: "Sobre mim" },
  en: { greeting: "Welcome to João's world", intro: "Projects, ideas and a little of my journey.", enter: "Explore João's world", back: "Back", projects: "Projects", about: "About me" },
  es: { greeting: "Bienvenido al mundo de João", intro: "Proyectos, ideas y un poco de mi trayectoria.", enter: "Conoce el mundo de João", back: "Volver", projects: "Proyectos", about: "Sobre mí" },
};
export default function JoaoOSPage() {
  const [language, setLanguage] = useState<Language>("pt");
  const [entered, setEntered] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem("joaoos-language");
    if (saved === "pt" || saved === "en" || saved === "es") setLanguage(saved);
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const changeLanguage = (value: Language) => {
    setLanguage(value);
    localStorage.setItem("joaoos-language", value);
  };
  const t = translations[language];
  const locale = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-ES";
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#080d18] text-white">
      <div aria-hidden className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${entered ? "scale-100 blur-none" : "scale-105 blur-[3px]"}`} style={{ backgroundImage: "url('/wallpapers/joaoos-nebula.png')" }} />
      <div aria-hidden className="absolute inset-0 bg-black/45" />
      <div className="relative flex h-full min-h-0 flex-col items-center justify-between px-5 py-8 sm:py-10">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/35 p-1.5 backdrop-blur-xl" aria-label="Idioma">
          <Globe size={16} className="mx-2" />
          {(["pt", "en", "es"] as const).map((value) => <button key={value} type="button" onClick={() => changeLanguage(value)} aria-pressed={language === value} className={`rounded-full px-3 py-1 text-sm ${language === value ? "bg-white text-black" : "text-white/80 hover:bg-white/15"}`}>{value === "pt" ? "PT-BR" : value.toUpperCase()}</button>)}
        </div>
        {!entered ? (
          <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center">
            <LockKeyhole size={20} className="text-white/75" />
            <div className="text-6xl font-light tabular-nums tracking-tight sm:text-8xl">{now ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(now) : "--:--"}</div>
            <div className="text-sm text-white/80">{now ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now) : ""}</div>
            <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{t.greeting}</h1>
            <p className="text-white/80">{t.intro}</p>
            <button type="button" onClick={() => setEntered(true)} className="mt-2 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-6 py-3 font-medium backdrop-blur-xl transition hover:bg-white/25">{t.enter}<ArrowRight size={18} /></button>
          </div>
        ) : (
          <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-black/45 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between"><h1 className="text-xl font-semibold">JoãoOS</h1><button type="button" onClick={() => setEntered(false)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/15"><ArrowLeft size={16}/>{t.back}</button></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <a href="/projetos" className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 hover:bg-white/20"><Folder size={30}/>{t.projects}</a>
              <a href="/sobre" className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 hover:bg-white/20"><UserRound size={30}/>{t.about}</a>
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 p-6 text-white/60"><Terminal size={30}/>Terminal</div>
            </div>
          </div>
        )}
        <div className="text-xs text-white/65">© {now?.getFullYear() ?? "2026"} João Panucci · JoãoOS</div>
      </div>
    </div>
  );
}
TSX
printf '\nRota criada: /joaoos\n'
printf 'Executando lint...\n'
npm run lint -- src/app/joaoos/page.tsx
printf '\nEstado Git:\n'
git status --short
printf '\nTeste local: npm run dev e abra http://localhost:3000/joaoos\n'
