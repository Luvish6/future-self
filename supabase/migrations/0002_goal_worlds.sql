-- v2 Goal Worlds: per-goal theme; link journal, routine and audio rows to a goal (null = "General").
-- Additive only; safe to run on a database that already has 0001 applied.

alter table public.goals
  add column if not exists theme text not null default 'neutral'
  check (theme in ('neutral','love','confidence','finance','peace','career'));

alter table public.goals
  add column if not exists description text not null default '' check (char_length(description) <= 1000),
  add column if not exists reflection_questions text[] not null default '{}' check (cardinality(reflection_questions) <= 12);

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

-- RLS policies from 0001 already cover the new columns (row-level, owner-only).
