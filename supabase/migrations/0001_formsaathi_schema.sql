-- FormSaathi Phase 4 Schema & Row Level Security (RLS)
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Public Opportunity Listings (separate from private student data)
create table if not exists public.public_opportunities (
  id text primary key,
  is_demo boolean not null default true,
  category text not null,
  title_en text not null,
  title_hi text not null,
  title_bn text not null,
  provider_en text not null,
  amount_label_en text not null,
  summary_en text not null,
  verified_portal_url text,
  created_at timestamptz not null default now()
);

alter table public.public_opportunities enable row level security;

create policy "Public opportunities are readable by everyone"
  on public.public_opportunities
  for select
  using (true);

-- 2. Private Student Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  first_gen boolean not null default true,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi', 'bn')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Private Student Education Preferences
create table if not exists public.student_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  course text not null default '',
  study_year text not null default '',
  institution_type text not null default '',
  annual_income text not null default '',
  state text not null default '',
  category text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.student_preferences enable row level security;

create policy "Users can view own preferences"
  on public.student_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.student_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.student_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Saved Opportunities per User
create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scholarship_id text not null,
  notes text default '',
  created_at timestamptz not null default now(),
  unique (user_id, scholarship_id)
);

alter table public.saved_opportunities enable row level security;

create policy "Users can view own saved opportunities"
  on public.saved_opportunities for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved opportunities"
  on public.saved_opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved opportunities"
  on public.saved_opportunities for delete
  using (auth.uid() = user_id);

-- 5. Application & Document Checklist Tracking per User
create table if not exists public.application_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scholarship_id text not null,
  status text not null default 'preparing' check (status in ('preparing', 'ready', 'submitted_externally')),
  checked_docs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, scholarship_id)
);

alter table public.application_tracking enable row level security;

create policy "Users can view own tracking"
  on public.application_tracking for select
  using (auth.uid() = user_id);

create policy "Users can insert own tracking"
  on public.application_tracking for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracking"
  on public.application_tracking for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Automatically create profile & preferences rows on new user sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  insert into public.student_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
