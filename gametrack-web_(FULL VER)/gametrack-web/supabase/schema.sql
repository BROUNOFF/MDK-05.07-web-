-- Схема базы данных GameTrack для Supabase (PostgreSQL).
-- Как применить: Supabase -> SQL Editor -> New query -> вставить весь файл -> Run.
-- Пользователи хранятся во встроенной таблице auth.users (её создаёт сам Supabase).

-- Справочник игр (кэш данных из RAWG API)
create table if not exists public.games (
  id            bigint primary key,           -- id игры в RAWG
  title         text not null,
  cover_url     text,
  release_year  int,
  developer     text,
  genres        text[] not null default '{}',
  platforms     text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- Коллекция пользователя (связь пользователь — игра)
create table if not exists public.user_games (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id         bigint not null references public.games(id),
  status          text not null default 'backlog'
                  check (status in ('backlog', 'playing', 'completed', 'dropped')),
  platform        text,
  rating          smallint check (rating between 1 and 10),
  price           numeric(10, 2) check (price >= 0),
  playtime_hours  numeric(7, 1) not null default 0 check (playtime_hours >= 0),
  notes           text,
  is_favorite     boolean not null default false,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, game_id)                   -- одна игра не может попасть в библиотеку дважды
);

-- Игровые сессии (для карты активности)
create table if not exists public.game_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  user_game_id  uuid not null references public.user_games(id) on delete cascade,
  played_on     date not null default current_date,
  hours         numeric(5, 1) not null
);

-- Цель на год
create table if not exists public.yearly_goals (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  year     int not null,
  target   int not null check (target > 0),
  primary key (user_id, year)
);

create index if not exists user_games_user_idx on public.user_games(user_id);
create index if not exists game_sessions_user_idx on public.game_sessions(user_id);

-- Права для авторизованных пользователей
grant select, insert on public.games to authenticated;
grant select, insert, update, delete on public.user_games, public.game_sessions, public.yearly_goals to authenticated;

-- Row Level Security: каждый видит и меняет только свои записи
alter table public.games         enable row level security;
alter table public.user_games    enable row level security;
alter table public.game_sessions enable row level security;
alter table public.yearly_goals  enable row level security;

drop policy if exists "games: read" on public.games;
create policy "games: read" on public.games
  for select to authenticated using (true);

drop policy if exists "games: insert" on public.games;
create policy "games: insert" on public.games
  for insert to authenticated with check (true);

drop policy if exists "user_games: own rows" on public.user_games;
create policy "user_games: own rows" on public.user_games
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "game_sessions: own rows" on public.game_sessions;
create policy "game_sessions: own rows" on public.game_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "yearly_goals: own rows" on public.yearly_goals;
create policy "yearly_goals: own rows" on public.yearly_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
