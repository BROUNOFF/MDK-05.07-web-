-- Схема базы данных GameTrack (PostgreSQL).
-- Сервер выполняет этот файл при каждом запуске: "if not exists" не даёт создать таблицы дважды.

-- Пользователи. Пароль хранится только в виде bcrypt-хэша
create table if not exists users (
  id             serial primary key,
  email          text not null unique,
  password_hash  text not null,
  name           text not null,
  created_at     timestamptz not null default now()
);

-- Справочник игр (кэш данных из каталога / RAWG API)
create table if not exists games (
  id            bigint primary key,
  title         text not null,
  cover_url     text,
  release_year  int,
  developer     text,
  genres        text[] not null default '{}',
  platforms     text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- Коллекция пользователя: связь «пользователь — игра» с его прогрессом
create table if not exists user_games (
  id              uuid primary key default gen_random_uuid(),
  user_id         int not null references users(id) on delete cascade,
  game_id         bigint not null references games(id),
  status          text not null default 'backlog'
                  check (status in ('backlog', 'playing', 'completed', 'dropped')),
  platform        text,
  rating          smallint check (rating between 1 and 10),
  price           numeric(10, 2) check (price >= 0),
  playtime_hours  numeric(7, 1) not null default 0 check (playtime_hours >= 0),
  notes           text not null default '',
  is_favorite     boolean not null default false,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, game_id)
);

-- Игровые сессии: из них строится карта активности
create table if not exists game_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       int not null references users(id) on delete cascade,
  user_game_id  uuid not null references user_games(id) on delete cascade,
  played_on     date not null default current_date,
  hours         numeric(5, 1) not null
);

-- Цель на год
create table if not exists yearly_goals (
  user_id  int not null references users(id) on delete cascade,
  year     int not null,
  target   int not null check (target between 1 and 365),
  primary key (user_id, year)
);

create index if not exists user_games_user_idx on user_games(user_id);
create index if not exists game_sessions_user_idx on game_sessions(user_id);
