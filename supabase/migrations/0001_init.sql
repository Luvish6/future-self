-- DRAFT (Phase 0). Review and apply in Phase 2. Later-phase tables are added in their phases.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  timezone text default 'UTC',
  onboarding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  category text not null default 'general',
  why text check (char_length(why) <= 2000),
  identity_statement text check (char_length(identity_statement) <= 500),
  target_date date,
  status text not null default 'active' check (status in ('active','paused','done')),
  created_at timestamptz not null default now()
);

create table public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id uuid references public.goals on delete set null,
  text text not null check (char_length(text) between 1 and 500),
  audio_path text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.visualizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id uuid references public.goals on delete set null,
  title text not null check (char_length(title) <= 200),
  script text not null check (char_length(script) <= 20000),
  duration_min smallint not null default 5 check (duration_min between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id uuid references public.goals on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  cue text check (char_length(cue) <= 300),
  cadence jsonb not null default '{"type":"daily"}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  log_date date not null,
  done boolean not null default true,
  unique (habit_id, log_date)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('reflection','gratitude','letter','win','obstacle','lesson','weekly')),
  title text check (char_length(title) <= 200),
  body text not null check (char_length(body) <= 20000),
  mood smallint check (mood between 1 and 5),
  created_at timestamptz not null default now()
);

-- RLS: owner-only access on every table
alter table public.profiles enable row level security;
create policy own_profile on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['goals','affirmations','visualizations','habits','habit_logs','journal_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy own_rows on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
