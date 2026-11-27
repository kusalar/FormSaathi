-- FormSaathi Phase 4.2 Additive Migration: Extended Student Profile Fields
-- Run this in Supabase Dashboard -> SQL Editor (after 0001_formsaathi_schema.sql)

alter table public.student_preferences
  add column if not exists college_name text not null default '',
  add column if not exists branch text not null default '',
  add column if not exists graduation_year text not null default '',
  add column if not exists skills text not null default '',
  add column if not exists preferred_categories text[] not null default '{}',
  add column if not exists preferred_work_mode text not null default '';
