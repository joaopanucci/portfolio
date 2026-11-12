"use client";
import { useEffect, useRef, useState } from "react";
import { apps } from "../apps";
import { callJava, useJavaStatus } from "../java";
import type { AppProps } from "./types";

type Entry = { command: string; output: string[]; error?: boolean };
const COMMANDS = ["help", "about", "projects", "skills", "nyron", "neofetch", "java --version", "whoami", "clear"];
const LOCAL_HELP = "neofetch · open <app> · theme <cyan|violet|amber>";
const BANNER = [
  "   o───o───o      JoãoOS · Neural Edition",
  "  /│\ /│\ /│\     java · spring · react · nyron",
  " o─┼─o─┼─o─┼─o",
  "  \│/ \│/ \│/",
  "   o───o───o",
];

export function TerminalApp({ t, language, prefs, update, openApp }: AppProps) {
  const java = useJavaStatus();
  const [history, setHistory] = useState<Entry[]>([]);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const recall = useRef<{ list: string[]; index: number }>({ list: [], index: 0 });
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [history, busy]);

  /** Commands that act on the desktop itself run in the browser, never on the JVM. */
  function runLocal(text: string): { lines: string[]; error?: boolean } | null {
    const [name, ...rest] = text.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    if (text === "neofetch") {
      const mins = Math.floor((Date.now() - startedAt) / 60000);
      const secs = Math.floor(((Date.now() - startedAt) % 60000) / 1000);
      return {
        lines: [
          "joao@joaoos",
          "-----------",
          "OS:      JoãoOS Neural Edition",
          "Host:    João Panucci",
          "Stack:   Next.js 16 · React 19 · Java 21",
          `Java:    ${java === "live" ? "JVM " + t.javaLive : t.javaDemo}`,
          "Shell:   zsh",
          `Theme:   ${prefs.accent}`,
          `Uptime:  ${mins}m ${secs}s`,
        ],
      };
    }
    if (name === "theme") {
      if (arg === "cyan" || arg === "violet" || arg === "amber") {
        update({ accent: arg });
        return { lines: [`theme → ${arg}`] };
      }
      return { lines: [t.unknownTheme], error: true };
    }
    if (name === "open") {
      const app = apps.find((a) => a.id === arg);
      if (!app) return { lines: [t.unknownApp + ": " + (arg || "—"), apps.map((a) => a.id).join(" · ")], error: true };
      openApp(app.id);
      return { lines: [`open ${app.id}`] };
    }
    return null;
  }

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
    const local = runLocal(text);
    if (local) {
      setHistory((h) => [...h.slice(-99), { command: text, output: local.lines, error: local.error }]);
      return;
    }
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const r = await callJava(text, language, abort.signal);
      const lines = text === "help" ? [...r.lines, LOCAL_HELP] : r.lines;
      setHistory((h) => [...h.slice(-99), { command: text, output: lines, error: !r.ok }]);
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
