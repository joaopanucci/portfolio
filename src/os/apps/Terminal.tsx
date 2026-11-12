"use client";
import { useEffect, useRef, useState } from "react";
import { callJava, useJavaStatus } from "../java";
import type { AppProps } from "./types";

type Entry = { command: string; output: string[]; error?: boolean };
const COMMANDS = ["help", "about", "projects", "skills", "nyron", "java --version", "whoami", "clear"];
const BANNER = [
  "      ✦        JoãoOS · Universe Edition",
  "    ·   ·      java · spring · react · nyron",
  "   ✦  ☼  ✦",
  "    ·   ·",
];

export function TerminalApp({ t, language }: AppProps) {
  const java = useJavaStatus();
  const [history, setHistory] = useState<Entry[]>([]);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const recall = useRef<{ list: string[]; index: number }>({ list: [], index: 0 });
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [history, busy]);

  async function run(raw: string) {
    if (busy) return;
    const text = raw.trim();
    if (!text || text.length > 120 || /[\x00-\x1f]/.test(raw)) {
      setHistory((h) => [...h.slice(-99), { command: raw, output: [t.invalid], error: true }]);
      return;
    }
    setCommand("");
    recall.current.list.push(text);
    recall.current.index = recall.current.list.length;
    if (text === "clear") return setHistory([]);
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const r = await callJava(text, language, abort.signal);
      setHistory((h) => [...h.slice(-99), { command: text, output: r.lines, error: !r.ok }]);
    } catch {
      /* aborted on unmount */
    } finally {
      if (controller.current === abort) setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const r = recall.current;
    if (e.key === "ArrowUp" && r.list.length) {
      e.preventDefault();
      r.index = Math.max(0, r.index - 1);
      setCommand(r.list[r.index]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      r.index = Math.min(r.list.length, r.index + 1);
      setCommand(r.list[r.index] ?? "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => command && c.startsWith(command));
      if (match) setCommand(match);
    }
  }

  return (
    <div className="os-terminal" onClick={() => input.current?.focus()}>
      <div className="os-terminal-bar">
        <span>joao — zsh — 80×24</span>
        <span className={`os-java-pill is-${java}`}>
          <i /> {java === "live" ? t.javaLive : java === "demo" ? t.javaDemo : t.javaChecking}
        </span>
      </div>
      <div className="os-terminal-body" role="log" aria-live="polite">
        <pre className="os-banner">{BANNER.join("\n")}</pre>
        <p className="os-muted">{t.terminalIntro}</p>
        {java === "demo" && <p className="os-warn">{t.terminalDemoNote}</p>}
        {history.map((entry, i) => (
          <div key={i}>
            <p>
              <span className="os-prompt">joao@joaoos ~ %</span> {entry.command}
            </p>
            <pre className={entry.error ? "is-error" : ""}>{entry.output.join("\n")}</pre>
          </div>
        ))}
        {busy && <p role="status" className="os-muted">{t.loading}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(command);
          }}
          className="os-terminal-form"
        >
          <label htmlFor="os-command" className="os-prompt">
            joao@joaoos ~ %
          </label>
          <input
            id="os-command"
            ref={input}
            aria-label={t.command}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={120}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </form>
        <div className="os-terminal-chips">
          {COMMANDS.map((c) => (
            <button key={c} type="button" disabled={busy} onClick={() => void run(c)}>
              {c}
            </button>
          ))}
        </div>
        <div ref={end} />
      </div>
    </div>
  );
}
