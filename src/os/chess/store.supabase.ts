import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GameRow, Player, Store } from "./service";

/** Server-side admin client. The service-role key never reaches the browser. */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const PLAYER_COLS = "id, nickname, points, rating, games, wins, losses, draws";

export function supabaseStore(db: SupabaseClient): Store {
  const must = <T>(res: { data: T | null; error: { message: string } | null }): T => {
    if (res.error) throw new Error(res.error.message);
    return res.data as T;
  };
  return {
    async getPlayer(id) {
      return must(await db.from("chess_players").select(PLAYER_COLS).eq("id", id).maybeSingle<Player>());
    },
    async upsertPlayer(id, nickname) {
      const existing = must(await db.from("chess_players").select(PLAYER_COLS).eq("id", id).maybeSingle<Player>());
      if (existing) return must(await db.from("chess_players").update({ nickname }).eq("id", id).select(PLAYER_COLS).single<Player>());
      return must(await db.from("chess_players").insert({ id, nickname }).select(PLAYER_COLS).single<Player>());
    },
    async patchPlayer(id, patch) {
      must(await db.from("chess_players").update(patch).eq("id", id).select("id").maybeSingle());
    },
    async insertBotGame(row) {
      must(await db.from("chess_bot_games").insert(row).select("id").single());
    },
    async lastBotGameAt(playerId) {
      const r = must(await db.from("chess_bot_games").select("created_at").eq("player_id", playerId).order("created_at", { ascending: false }).limit(1).maybeSingle<{ created_at: string }>());
      return r ? Date.parse(r.created_at) : null;
    },
    async getGameByCode(code) {
      return must(await db.from("chess_games").select("*").eq("code", code).maybeSingle<GameRow>());
    },
    async insertGame(row) {
      const res = await db.from("chess_games").insert(row).select("*").single<GameRow>();
      if (res.error) {
        if (res.error.code === "23505") return null; // code already taken
        throw new Error(res.error.message);
      }
      return res.data;
    },
    async updateGame(id, patch, expectUpdatedAt) {
      const res = await db.from("chess_games").update(patch).eq("id", id).eq("updated_at", expectUpdatedAt).select("*").maybeSingle<GameRow>();
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
  };
}
