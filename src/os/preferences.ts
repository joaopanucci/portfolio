"use client";
import { useSyncExternalStore } from "react";
import type { Language } from "./i18n";

export type Preferences = {
  language: Language;
  reduce: boolean;
  accent: "cyan" | "violet" | "amber";
  magnify: boolean;
};

const defaults: Preferences = {
  language: "pt",
  reduce: false,
  accent: "cyan",
  magnify: true,
};
const KEY = "joaoos-preferences";
let cached: Preferences = defaults;
let rawCache: string | null | undefined;
const listeners = new Set<() => void>();

function parse(raw: string | null, legacy: string | null): Preferences {
  const value = raw ? JSON.parse(raw) : { language: legacy };
  return {
    language: ["pt", "en", "es"].includes(value?.language)
      ? value.language
      : "pt",
    reduce: value?.reduce === true,
    accent: ["violet", "amber"].includes(value?.accent)
      ? value.accent
      : "cyan",
    magnify: value?.magnify !== false,
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const legacy = localStorage.getItem("joaoos-language");
    const key = raw ?? legacy;
    if (key === rawCache) return cached;
    rawCache = key;
    cached = parse(raw, legacy);
  } catch {
    // Keep the last usable snapshot when browser storage is inaccessible.
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function usePreferences() {
  const preferences = useSyncExternalStore(subscribe, read, () => defaults);
  const update = (patch: Partial<Preferences>) => {
    cached = { ...read(), ...patch };
    try {
      const raw = JSON.stringify(cached);
      localStorage.setItem(KEY, raw);
      rawCache = raw;
    } catch {
      /* In-memory preferences remain usable when storage is blocked. */
    }
    listeners.forEach((listener) => listener());
  };
  return [preferences, update] as const;
}

function motionSubscribe(listener: () => void) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
export function useSystemReducedMotion() {
  return useSyncExternalStore(
    motionSubscribe,
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}
