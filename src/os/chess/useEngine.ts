"use client";
import { useCallback, useEffect, useRef } from "react";
import type { EngineMove, Level } from "./fast";

export type Thought = { move: EngineMove | null; score: number; depth: number };

/** Runs the chess engine in a Web Worker so the interface never freezes while it thinks. */
export function useEngine() {
  const worker = useRef<Worker | null>(null);
  const waiting = useRef(new Map<number, (m: Thought) => void>());
  const seq = useRef(0);
  useEffect(() => {
    try {
      const w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
      w.onmessage = (e: MessageEvent<{ id: number } & Thought>) => {
        waiting.current.get(e.data.id)?.(e.data);
        waiting.current.delete(e.data.id);
      };
      worker.current = w;
    } catch {
      worker.current = null;
    }
    const pending = waiting.current;
    return () => {
      worker.current?.terminate();
      pending.clear();
    };
  }, []);
  return useCallback((fen: string, level: Level) => {
    const id = ++seq.current;
    return new Promise<Thought>((resolve) => {
      if (worker.current) {
        waiting.current.set(id, resolve);
        worker.current.postMessage({ id, fen, level });
      } else {
        // no Worker support: search on the main thread, with a lighter level
        void import("./fast").then(({ think }) => resolve(think(fen, level === "master" || level === "hard" ? "medium" : level)));
      }
    });
  }, []);
}
