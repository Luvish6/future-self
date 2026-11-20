-- Future Self schema. Column names mirror src/lib/types.ts exactly (the client upserts rows as-is).
-- Every table is owner-only via Row Level Security. Deleting the auth user cascades to all data.
-- Voice recordings are NOT stored here (they stay in the user's browser).

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  display_name text not null default '' check (char_length(display_name) <= 80),
  onboarding jsonb check (onboarding is null or pg_column_size(onboarding) < 64000),
  core_values text[] not null default '{}' check (cardinality(core_values) <= 12)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 200),
  category text not null default 'general',
  why text not null default '' check (char_length(why) <= 2000),
  identity_statement text not null default '' check (char_length(identity_statement) <= 500),
  target_date date,
  status text not null default 'active' check (status in ('active','paused','done')),
  milestones jsonb not null default '[]' check (jsonb_typeof(milestones) = 'array' and pg_column_size(milestones) < 32000)
);

create table public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  goal_id uuid references public.goals on delete set null,
  text text not null check (char_length(text) between 1 and 500),
  audio_key text, -- key of a recording in the user's local IndexedDB
  is_favorite boolean not null default false
);

create table public.visualizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  goal_id uuid references public.goals on delete set null,
  title text not null check (char_length(title) <= 200),
  script text not null check (char_length(script) <= 20000),
  duration_min smallint not null default 5 check (duration_min between 1 and 60)
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  goal_id uuid references public.goals on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  cue text not null default '' check (char_length(cue) <= 300),
  minutes smallint not null default 5 check (minutes between 1 and 240),
  days smallint[] not null default '{}' check (days <@ array[0,1,2,3,4,5,6]::smallint[]),
  active boolean not null default true
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  habit_id uuid not null references public.habits on delete cascade,
  log_date date not null,
  unique (habit_id, log_date)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('reflection','gratitude','letter','win','obstacle','lesson','weekly')),
  title text not null default '' check (char_length(title) <= 200),
  body text not null check (char_length(body) <= 20000),
  mood smallint check (mood between 1 and 5),
  open_on date
);

create table public.routine_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  weekday smallint not null check (weekday between 0 and 6),
  start text not null check (start ~ '^\d{2}:\d{2}$'),
  "end" text not null check ("end" ~ '^\d{2}:\d{2}$'),
  label text not null default '' check (char_length(label) <= 80),
  kind text not null check (kind in ('sleep','work','study','commute','family','exercise','meal','free','other'))
);

create table public.audio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) <= 200),
  duration_s integer not null check (duration_s between 0 and 86400)
);

create table public.vision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  goal_id uuid references public.goals on delete set null,
  kind text not null check (kind in ('image','quote','milestone','description')),
  text text not null default '' check (char_length(text) <= 500),
  image text check (image is null or (image like 'data:image/jpeg;base64,%' and char_length(image) < 600000)),
  category text not null default 'general'
);

create index on public.goals (user_id);
create index on public.affirmations (user_id);
create index on public.visualizations (user_id);
create index on public.habits (user_id);
create index on public.habit_logs (user_id, log_date);
create index on public.journal_entries (user_id, created_at);
create index on public.routine_blocks (user_id, weekday);
create index on public.audio_sessions (user_id);
create index on public.vision_items (user_id);

-- Row Level Security: owner-only access everywhere.
alter table public.profiles enable row level security;
create policy own_profile on public.profiles
  for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['goals','affirmations','visualizations','habits','habit_logs','journal_entries','routine_blocks','audio_sessions','vision_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy own_rows on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Self-service account deletion (cascades to every table above).
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
