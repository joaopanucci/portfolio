"use client";
import { useEffect, useSyncExternalStore } from "react";
import type { Language } from "./i18n";
import { runOrbit } from "./engine";

export type JavaState = "checking" | "live" | "demo";
export type JavaResult = { ok: boolean; lines: string[]; live: boolean };

/**
 * The Java service needs its own JVM host. In development it defaults to
 * localhost:8080; in production it is only used when a public URL is set,
 * so visitors never trigger requests to their own machine.
 */
function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_JOAOOS_API_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "")
  );
}

let state: JavaState = "checking";
let started = false;
const listeners = new Set<() => void>();
function set(next: JavaState) {
  if (state === next) return;
  state = next;
  listeners.forEach((l) => l());
}

export async function callJava(
  command: string,
  language: Language,
  signal?: AbortSignal,
): Promise<JavaResult> {
  const base = baseUrl();
  if (base) {
    try {
      const timeout = AbortSignal.timeout(8000);
      const response = await fetch(`${base}/api/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, language }),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      const data: unknown = await response.json();
      if (
        data &&
        typeof data === "object" &&
        "lines" in data &&
        Array.isArray(data.lines) &&
        data.lines.every((line) => typeof line === "string")
      ) {
        set("live");
        return { ok: response.ok, lines: data.lines as string[], live: true };
      }
    } catch {
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    }
  }
  set("demo");
  return { ...localJava(command, language), live: false };
}

const demo = {
  pt: {
    unknown: "Comando não permitido. Digite help.",
    about: "JoãoOS — portfólio interativo de João Panucci.",
  },
  en: {
    unknown: "Command not allowed. Type help.",
    about: "JoãoOS — João Panucci’s interactive portfolio.",
  },
  es: {
    unknown: "Comando no permitido. Escribe help.",
    about: "JoãoOS — portafolio interactivo de João Panucci.",
  },
} as const;

/** Browser-side stand-in used when the JVM service is not reachable. */
function localJava(command: string, language: Language) {
  const text = demo[language];
  switch (command) {
    case "help":
      return { ok: true, lines: ["help · about · projects · skills · nyron · java --version · whoami · clear"] };
    case "about":
      return { ok: true, lines: [text.about] };
    case "projects":
      return { ok: true, lines: ["Dakiali — https://dakiali.com", "JELCH Group — https://jelchgroup.com", "AutoDock — https://github.com/joaopanucci/autodock", "Nyron Engine · Java", "SAPS — https://saps.saude.ms.gov.br"] };
    case "skills":
      return { ok: true, lines: ["Java · Spring Boot · TypeScript · React · Docker · PostgreSQL"] };
    case "whoami":
      return { ok: true, lines: ["João Panucci", "https://github.com/joaopanucci"] };
    case "java --version":
      return { ok: true, lines: ["(demo) JVM not connected — the service targets Java 21.", "Run services/joaoos-api to talk to a real JVM."] };
    case "nyron": {
      const r = runOrbit();
      return {
        ok: true,
        lines: [
          "Nyron tick loop · velocity-Verlet (TypeScript demo)",
          `3650 ticks · r ${r.min.toFixed(6)}–${r.max.toFixed(6)} AU · drift ${r.drift.toExponential(2)} AU · ${r.micros} µs`,
        ],
      };
    }
    default:
      return { ok: false, lines: [text.unknown] };
  }
}

export function useJavaStatus(): JavaState {
  useEffect(() => {
    if (started) return;
    started = true;
    void callJava("java --version", "pt");
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => "checking" as JavaState,
  );
}
