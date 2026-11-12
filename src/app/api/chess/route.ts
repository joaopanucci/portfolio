import { adminClient, supabaseStore } from "@/os/chess/store.supabase";
import { ApiError, createGame, gameAction, joinGame, playMove, saveProfile, submitBotGame } from "@/os/chess/service";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * One endpoint for every chess write. The browser sends the user's Supabase access token;
 * the server verifies it, then validates the move/game with the chess rules before touching the database.
 */
export async function POST(request: Request) {
  const db = adminClient();
  if (!db) return json({ error: "not-configured" }, 503);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return json({ error: "unauthorized" }, 401);
  const uid = data.user.id;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  const store = supabaseStore(db);
  try {
    switch (body.action) {
      case "profile":
        return json({ player: await saveProfile(store, uid, body.nickname) });
      case "bot-result":
        return json(await submitBotGame(store, uid, body));
      case "create":
        return json({ game: await createGame(store, uid, body.color) });
      case "join":
        return json({ game: await joinGame(store, uid, body.code) });
      case "move":
        return json({ game: await playMove(store, uid, body.code, body.uci) });
      case "act":
        return json({ game: await gameAction(store, uid, body.code, body.type) });
      default:
        return json({ error: "unknown-action" }, 400);
    }
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error("chess api", e);
    return json({ error: "server-error" }, 500);
  }
}
