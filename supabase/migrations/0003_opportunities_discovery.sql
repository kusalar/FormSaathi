-- FormSaathi Phase 5 Additive Migration: Opportunities Discovery & Application Tracking
-- Run this in Supabase Dashboard -> SQL Editor (after 0001 and 0002)
-- Safe and additive: does not drop or recreate existing tables.

-- 1. Extend public_opportunities for Scholarships, Internships, Jobs & future categories
alter table public.public_opportunities
  add column if not exists organisation text not null default '',
  add column if not exists description text not null default '',
  add column if not exists eligibility_criteria text not null default '',
  add column if not exists required_degrees text[] not null default '{}',
  add column if not exists required_branches text[] not null default '{}',
  add column if not exists eligible_years text[] not null default '{}',
  add column if not exists required_skills text[] not null default '{}',
  add column if not exists min_grad_year integer,
  add column if not exists max_grad_year integer,
  add column if not exists min_income_lakh numeric,
  add column if not exists max_income_lakh numeric,
  add column if not exists institution_types text[] not null default '{}',
  add column if not exists location text not null default 'All India',
  add column if not exists work_mode text not null default 'Remote',
  add column if not exists stipend_or_salary text not null default '',
  add column if not exists deadline date,
  add column if not exists application_url text,
  add column if not exists source_name text not null default 'FormSaathi Demo Catalog',
  add column if not exists source_url text,
  add column if not exists date_published timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'public_opportunities_status_check'
  ) then
    alter table public.public_opportunities
      add constraint public_opportunities_status_check
      check (status in ('active', 'expired'));
  end if;
end $$;

create index if not exists idx_public_opps_category on public.public_opportunities (category);
create index if not exists idx_public_opps_status on public.public_opportunities (status);
create index if not exists idx_public_opps_deadline on public.public_opportunities (deadline);
create index if not exists idx_public_opps_work_mode on public.public_opportunities (work_mode);
create index if not exists idx_public_opps_degrees on public.public_opportunities using gin (required_degrees);
create index if not exists idx_public_opps_branches on public.public_opportunities using gin (required_branches);
create index if not exists idx_public_opps_skills on public.public_opportunities using gin (required_skills);

-- 2. Extend application_tracking for Interested / Applied / Interview / Selected / Rejected + Notes
alter table public.application_tracking
  add column if not exists notes text not null default '',
  add column if not exists opportunity_title text not null default '';

alter table public.application_tracking
  drop constraint if exists application_tracking_status_check;

alter table public.application_tracking
  add constraint application_tracking_status_check
  check (status in (
    'preparing',
    'ready',
    'submitted_externally',
    'interested',
    'applied',
    'interview',
    'selected',
    'rejected'
  ));

create index if not exists idx_app_tracking_user_status on public.application_tracking (user_id, status);
create index if not exists idx_saved_opps_user on public.saved_opportunities (user_id);

-- Ensure users can delete their own application tracking records if desired
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'application_tracking'
      and policyname = 'Users can delete own tracking'
  ) then
    create policy "Users can delete own tracking"
      on public.application_tracking for delete
      using (auth.uid() = user_id);
  end if;
end $$;
