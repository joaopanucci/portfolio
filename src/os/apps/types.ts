import type { Language, Words } from "../i18n";
import type { Preferences } from "../preferences";
import type { AppId } from "../apps";

export type AppProps = {
  t: Words;
  language: Language;
  prefs: Preferences;
  update: (patch: Partial<Preferences>) => void;
  /** Optional deep-link argument (project id, era id…). `nonce` changes on every open. */
  arg?: { value: string; nonce: number };
  openApp: (id: AppId, arg?: string) => void;
  toast: (title: string, body?: string) => void;
  reduced: boolean;
};
