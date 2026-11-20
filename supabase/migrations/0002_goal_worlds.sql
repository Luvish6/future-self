-- v2 Goal Worlds: per-goal theme; link journal, routine and audio rows to a goal (null = "General").
-- Additive only; safe to run on a database that already has 0001 applied.

alter table public.goals
  add column if not exists theme text not null default 'neutral'
  check (theme in ('neutral','love','confidence','finance','peace','career'));

alter table public.goals
  add column if not exists description text not null default '' check (char_length(description) <= 1000),
  add column if not exists reflection_questions text[] not null default '{}' check (cardinality(reflection_questions) <= 12);

alter table public.habits
  add column if not exists weekly_target smallint check (weekly_target between 1 and 7);

-- Backfill suggested themes for existing goals (mirrors defaultTheme() in src/lib/worlds.ts).
update public.goals set theme = case
  when category in ('love','self_love','relationships') then 'love'
  when category in ('confidence','creativity') then 'confidence'
  when category = 'finance' then 'finance'
  when category in ('peace','health') then 'peace'
  when category in ('career','academic','productivity','learning') then 'career'
  else 'neutral' end
where theme = 'neutral';

alter table public.journal_entries add column if not exists goal_id uuid references public.goals on delete set null;
alter table public.routine_blocks add column if not exists goal_id uuid references public.goals on delete set null;
alter table public.audio_sessions add column if not exists goal_id uuid references public.goals on delete set null;

create index if not exists journal_entries_goal_idx on public.journal_entries (goal_id);
create index if not exists routine_blocks_goal_idx on public.routine_blocks (goal_id);
create index if not exists audio_sessions_goal_idx on public.audio_sessions (goal_id);

create table if not exists public.vision_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  goal_id uuid references public.goals on delete cascade,
  title text not null check (char_length(title) between 1 and 120)
);
create index if not exists vision_boards_user_idx on public.vision_boards (user_id);
alter table public.vision_boards enable row level security;
create policy own_rows on public.vision_boards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.vision_items
  add column if not exists board_id uuid references public.vision_boards on delete cascade,
  add column if not exists size text not null default 'S' check (size in ('S','M','L')),
  add column if not exists position integer not null default 0;

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  goal_id uuid references public.goals on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 100),
  loop boolean not null default false
);
create index if not exists playlists_user_idx on public.playlists (user_id);
alter table public.playlists enable row level security;
create policy own_rows on public.playlists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Evidence Journal + Simulator entries.
alter table public.journal_entries drop constraint if exists journal_entries_kind_check;
alter table public.journal_entries add constraint journal_entries_kind_check
  check (kind in ('reflection','gratitude','letter','win','obstacle','lesson','weekly','evidence','simulation'));
alter table public.journal_entries
  add column if not exists evidence jsonb check (evidence is null or pg_column_size(evidence) < 16000);

-- RLS policies from 0001 already cover the new columns (row-level, owner-only).
