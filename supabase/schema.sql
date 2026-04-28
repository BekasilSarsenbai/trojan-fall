-- ═══════════════════════════════════════════════════════
-- TROJAN FALL — Полная схема БД
-- ═══════════════════════════════════════════════════════

-- 1. Профили игроков
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text not null unique,
  display_name text,
  city         text not null default 'Almaty',
  country      text not null default 'KZ',
  rating       int  not null default 800,
  xp           int  not null default 0,
  rank_title   text not null default 'Рекрут',
  games_played int  not null default 0,
  games_won    int  not null default 0,
  win_streak   int  not null default 0,
  best_streak  int  not null default 0,
  last_active  timestamptz default now(),
  avatar_style text default 'soldier_1',
  created_at   timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Профиль виден всем" on profiles;
create policy "Профиль виден всем" on profiles
  for select using (true);

drop policy if exists "Только владелец редактирует" on profiles;
create policy "Только владелец редактирует" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Самостоятельный insert" on profiles;
create policy "Самостоятельный insert" on profiles
  for insert with check (auth.uid() = id);

-- Автосоздание профиля при регистрации
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name',
             split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name',
             split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- 2. Партии
create table if not exists games (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references profiles(id),
  pgn            text not null,
  result         text not null,
  player_color   text not null default 'white',
  accuracy       int,
  territory      int,
  incidents      jsonb,
  strengths      jsonb,
  headline       text,
  narrative      text,
  xp_earned      int  default 0,
  rating_delta   int  default 0,
  move_count     int,
  duration_secs  int,
  created_at     timestamptz default now()
);

alter table games enable row level security;

drop policy if exists "Партии видны всем" on games;
create policy "Партии видны всем" on games
  for select using (true);

drop policy if exists "Только владелец создаёт" on games;
create policy "Только владелец создаёт" on games
  for insert with check (auth.uid() = user_id);


-- 3. XP события
create table if not exists xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id),
  amount     int not null,
  reason     text not null,
  game_id    uuid references games(id),
  created_at timestamptz default now()
);


-- 4. Leaderboard view
create or replace view city_leaderboard as
  select
    p.id,
    p.username,
    p.display_name,
    p.city,
    p.rating,
    p.xp,
    p.rank_title,
    p.games_played,
    p.games_won,
    p.win_streak,
    p.avatar_style,
    row_number() over (partition by p.city order by p.rating desc) as city_rank
  from profiles p
  where p.games_played > 0
  order by p.city, p.rating desc;


-- 5. Multiplayer matches
create table if not exists matches (
  id              uuid primary key default gen_random_uuid(),
  white_user_id   uuid references profiles(id),
  black_user_id   uuid references profiles(id),
  white_username  text,
  black_username  text,
  pgn             text not null default '',
  current_fen     text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn            text not null default 'white',
  status          text not null default 'waiting',  -- waiting | active | finished | abandoned
  result          text,                              -- win_white | win_black | draw | resigned
  end_method      text,                              -- checkmate | stalemate | resignation | draw
  invite_code     text not null unique default substr(md5(random()::text), 1, 8),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists matches_invite_code_idx on matches (invite_code);
create index if not exists matches_status_idx on matches (status);

alter table matches enable row level security;

drop policy if exists "Матчи видны всем" on matches;
create policy "Матчи видны всем" on matches
  for select using (true);

drop policy if exists "Создатель ставит белых" on matches;
create policy "Создатель ставит белых" on matches
  for insert with check (auth.uid() = white_user_id);

drop policy if exists "Игроки матча обновляют" on matches;
create policy "Игроки матча обновляют" on matches
  for update using (
    auth.uid() = white_user_id
    or auth.uid() = black_user_id
    or (black_user_id is null and status = 'waiting')
  );

-- Auto-bump updated_at on every change
create or replace function bump_match_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists matches_updated_at on matches;
create trigger matches_updated_at
  before update on matches
  for each row execute function bump_match_updated_at();

-- Enable Realtime publication for matches
alter publication supabase_realtime add table matches;


-- 6. Weekly scores
create table if not exists weekly_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id),
  city       text not null,
  score      int  not null default 0,
  week_start date not null default date_trunc('week', current_date)::date,
  unique(user_id, week_start)
);
