-- ============================================================================
-- HERBEAT — DATABASE SCHEMA
-- Run this once in your Supabase project's SQL editor (Project > SQL Editor).
-- ============================================================================
-- SECURITY MODEL
-- • Every table has Row Level Security (RLS) enabled with NO default access.
-- • Policies below grant a row's owner (auth.uid() = user_id) access to their
--   own rows only, for every operation (select/insert/update/delete).
-- • There is no "service role" bypass used anywhere in the app code — the
--   browser and server both talk to Supabase using the anon key, so RLS is
--   the actual enforcement layer, not a formality.
-- • auth.users (email, password hash, sessions) is fully managed by
--   Supabase Auth: passwords are hashed (bcrypt) and never touch our tables.
-- • Data at rest is encrypted by Supabase/Postgres disk encryption; data in
--   transit is TLS-only (enforced by Supabase and by this app's HSTS header).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────────────────────
-- One row per user. Holds onboarding answers used to personalize insights.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_year int,
  avg_cycle_length int default 28,          -- days, used for the projected curve
  avg_period_length int default 5,
  tracking_goal text,                        -- e.g. 'understand my body', 'ttc', 'avoid pregnancy', 'manage symptoms'
  lifestyle jsonb default '{}'::jsonb,        -- questionnaire: sleep habits, exercise freq, stress baseline, diet notes
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_owner_select" on profiles for select using (auth.uid() = id);
create policy "profiles_owner_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_owner_update" on profiles for update using (auth.uid() = id);
create policy "profiles_owner_delete" on profiles for delete using (auth.uid() = id);

-- ── PERIODS ─────────────────────────────────────────────────────────────────
-- Manual period logs. This is the anchor the cycle-day math is built from.
create table if not exists periods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz default now()
);

alter table periods enable row level security;

create policy "periods_owner_all" on periods for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists periods_user_date_idx on periods (user_id, start_date desc);

-- ── DAILY CHECK-INS ─────────────────────────────────────────────────────────
-- The quick, tap-based daily log: mood, energy, symptoms, flow that day.
create table if not exists daily_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  mood text,                     -- 'great' | 'good' | 'okay' | 'low' | 'rough'
  energy int check (energy between 1 and 5),
  flow text,                     -- 'none' | 'spotting' | 'light' | 'medium' | 'heavy'
  symptoms text[] default '{}',  -- e.g. ['cramps','headache','bloating']
  notes text,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

alter table daily_checkins enable row level security;

create policy "checkins_owner_all" on daily_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists checkins_user_date_idx on daily_checkins (user_id, log_date desc);

-- ── HABIT / LIFESTYLE LOGS ────────────────────────────────────────────────
-- What the user did that day, so it can be correlated against cycle phase.
create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  sleep_hours numeric,
  exercise_minutes int,
  stress_level int check (stress_level between 1 and 5),
  water_glasses int,
  caffeine_servings int,
  alcohol_servings int,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

alter table habit_logs enable row level security;

create policy "habit_logs_owner_all" on habit_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists habit_logs_user_date_idx on habit_logs (user_id, log_date desc);

-- ── AI ASSISTANT CONVERSATIONS ──────────────────────────────────────────────
create table if not exists ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New chat',
  created_at timestamptz default now()
);

alter table ai_conversations enable row level security;

create policy "ai_conversations_owner_all" on ai_conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table ai_messages enable row level security;

create policy "ai_messages_owner_all" on ai_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists ai_messages_conv_idx on ai_messages (conversation_id, created_at);

-- ── FUTURE: WEARABLE DEVICE READINGS ────────────────────────────────────────
-- Placeholder table so the wearable integration has somewhere to land later
-- without a schema migration touching the tables above.
create table if not exists device_readings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null,
  metric text not null,          -- e.g. 'skin_temp', 'hrv', 'resting_hr'
  value numeric not null,
  unit text,
  source text default 'wearable',
  created_at timestamptz default now()
);

alter table device_readings enable row level security;

create policy "device_readings_owner_all" on device_readings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists device_readings_user_time_idx on device_readings (user_id, recorded_at desc);

-- ── updated_at trigger for profiles ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

-- ── auto-create a profile row the moment someone signs up ──────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
