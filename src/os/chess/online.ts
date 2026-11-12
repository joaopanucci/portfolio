import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GameRow, Player } from "./service";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the site was built with Supabase credentials. Without them chess still works against the bot. */
export const onlineEnabled = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!onlineEnabled) throw new ApiFail("not-configured", 503);
  return (client ??= createClient(URL!, KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "joaoos-chess-auth" },
    realtime: { params: { eventsPerSecond: 8 } },
  }));
}

export class ApiFail extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** The current anonymous session. `create` signs the visitor in the first time they need an identity. */
export async function session(create: boolean): Promise<{ userId: string; token: string } | null> {
  const c = db();
  const { data } = await c.auth.getSession();
  if (data.session) return { userId: data.session.user.id, token: data.session.access_token };
  if (!create) return null;
  const res = await c.auth.signInAnonymously();
  if (res.error || !res.data.session) throw new ApiFail("unauthorized", 401);
  return { userId: res.data.session.user.id, token: res.data.session.access_token };
}

export async function call<T>(body: Record<string, unknown>, retry = true): Promise<T> {
  const s = await session(true);
  if (!s) throw new ApiFail("unauthorized", 401);
  let res: Response;
  try {
    res = await fetch("/api/chess", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiFail("network", 0);
  }
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (res.status === 401 && retry) {
    // the stored session is stale (expired, or its account was removed): start a fresh anonymous one
    await db().auth.signOut({ scope: "local" });
    return call<T>(body, false);
  }
  if (!res.ok) throw new ApiFail(json.error ?? "generic", res.status);
  return json;
}

const COLS = "id, nickname, points, rating, games, wins, losses, draws";

/** Your own profile, or null if you have none yet. Never creates an anonymous user. */
export async function myProfile(): Promise<Player | null> {
  const s = await session(false);
  if (!s) return null;
  const { data } = await db().from("chess_players").select(COLS).eq("id", s.userId).maybeSingle<Player>();
  return data;
}

export async function leaderboard(limit = 25): Promise<Player[]> {
  const { data } = await db().from("chess_players").select(COLS).order("points", { ascending: false }).order("rating", { ascending: false }).limit(limit).returns<Player[]>();
  return data ?? [];
}

export async function players(ids: string[]): Promise<Record<string, Player>> {
  if (!ids.length) return {};
  const { data } = await db().from("chess_players").select(COLS).in("id", ids).returns<Player[]>();
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

export async function fetchGame(code: string): Promise<GameRow | null> {
  const { data } = await db().from("chess_games").select("*").eq("code", code).maybeSingle<GameRow>();
  return data;
}

export async function myGames(): Promise<GameRow[]> {
  const s = await session(false);
  if (!s) return [];
  const { data } = await db().from("chess_games").select("*").in("status", ["waiting", "active"]).order("updated_at", { ascending: false }).limit(6).returns<GameRow[]>();
  return data ?? [];
}

/** Live updates for one game: Realtime for speed, plus a slow poll in case the socket drops. */
export function watchGame(code: string, onRow: (g: GameRow) => void): () => void {
  const c = db();
  const channel = c
    .channel(`chess-${code}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "chess_games", filter: `code=eq.${code}` }, (p) => {
      if (p.new && "id" in p.new) onRow(p.new as GameRow);
    })
    .subscribe();
  const timer = window.setInterval(() => {
    void fetchGame(code).then((g) => g && onRow(g));
  }, 4000);
  return () => {
    window.clearInterval(timer);
    void c.removeChannel(channel);
  };
}

/* ───────── scores kept in this browser when the visitor has no online profile ───────── */
const LOCAL_KEY = "joaoos-chess-local";
export type LocalScore = { points: number; games: number; wins: number };
export function readLocal(): LocalScore {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null") as LocalScore | null;
    if (v && typeof v.points === "number") return v;
  } catch {
    /* ignore */
  }
  return { points: 0, games: 0, wins: 0 };
}
export function addLocal(points: number, won: boolean): LocalScore {
  const v = readLocal();
  const next = { points: v.points + points, games: v.games + 1, wins: v.wins + (won ? 1 : 0) };
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
