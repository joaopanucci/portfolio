-- JoãoOS · Xadrez — schema do Supabase
-- Cole este arquivo inteiro em  Supabase → SQL Editor → New query → Run.
-- Antes disso, ative  Authentication → Sign In / Providers → "Allow anonymous sign-ins".

create extension if not exists pgcrypto;

-- ───────── jogadores (ranking) ─────────
create table if not exists public.chess_players (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 2 and 20),
  points      integer not null default 0 check (points >= 0),
  rating      integer not null default 1000,
  games       integer not null default 0,
  wins        integer not null default 0,
  losses      integer not null default 0,
  draws       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists chess_players_points_idx on public.chess_players (points desc);

-- ───────── partidas contra o João-Bot ─────────
create table if not exists public.chess_bot_games (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.chess_players (id) on delete cascade,
  level         text not null check (level in ('easy', 'medium', 'hard', 'master')),
  player_color  text not null check (player_color in ('w', 'b')),
  result        text not null check (result in ('win', 'loss', 'draw')),
  moves         text[] not null default '{}',
  points        integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists chess_bot_games_player_idx on public.chess_bot_games (player_id, created_at desc);

-- ───────── partidas online (convite por código) ─────────
create table if not exists public.chess_games (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  white_id    uuid references auth.users (id) on delete set null,
  black_id    uuid references auth.users (id) on delete set null,
  status      text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  fen         text not null,
  moves       text[] not null default '{}',
  turn        text not null default 'w' check (turn in ('w', 'b')),
  result      text check (result in ('white', 'black', 'draw')),
  reason      text,
  draw_offer  text check (draw_offer in ('w', 'b')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at muda a cada alteração (a API usa isso como controle de concorrência)
create or replace function public.chess_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end $$;

drop trigger if exists chess_games_touch on public.chess_games;
create trigger chess_games_touch before update on public.chess_games
  for each row execute function public.chess_touch();
drop trigger if exists chess_players_touch on public.chess_players;
create trigger chess_players_touch before update on public.chess_players
  for each row execute function public.chess_touch();

-- ───────── segurança (RLS) ─────────
-- Escritas só acontecem pela API (service role), que valida cada jogada.
alter table public.chess_players   enable row level security;
alter table public.chess_bot_games enable row level security;
alter table public.chess_games     enable row level security;

drop policy if exists "ranking é público" on public.chess_players;
create policy "ranking é público" on public.chess_players for select using (true);

drop policy if exists "vê só as próprias partidas contra o bot" on public.chess_bot_games;
create policy "vê só as próprias partidas contra o bot" on public.chess_bot_games
  for select using (auth.uid() = player_id);

drop policy if exists "participantes leem a partida" on public.chess_games;
create policy "participantes leem a partida" on public.chess_games
  for select using (auth.uid() = white_id or auth.uid() = black_id);

revoke insert, update, delete on public.chess_players, public.chess_bot_games, public.chess_games from anon, authenticated;

-- ───────── tempo real: a partida online recebe as jogadas ao vivo ─────────
do $$
begin
  alter publication supabase_realtime add table public.chess_games;
exception when duplicate_object then null;
end $$;
