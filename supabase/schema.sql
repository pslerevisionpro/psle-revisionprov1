-- ============================================================
-- PSLE RevisionPro — Supabase Schema
-- Run this in Supabase SQL Editor to set up your database
-- ============================================================

-- ---- Profiles table ----------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  email           text,
  role            text check (role in ('student', 'parent', 'tutor')) not null default 'student',
  grade           text,          -- 'std6' | 'std7' (students only)
  school          text,          -- tutors
  phone           text,          -- tutors
  child_name      text,          -- parents
  -- Consent fields (Botswana Data Protection Act 2018)
  consent_privacy boolean default false,
  consent_terms   boolean default false,
  consent_data    boolean default false,
  consent_date    timestamptz,
  -- Meta
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- Quiz results table ------------------------------------
create table if not exists public.quiz_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  subject    text not null,
  score      integer not null,
  total      integer not null,
  pct        integer not null,
  created_at timestamptz default now()
);

-- ---- Row Level Security ------------------------------------
alter table public.profiles    enable row level security;
alter table public.quiz_results enable row level security;

-- Profiles: users can read/update their own row
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Quiz results: users can read/insert their own results
create policy "Users can read own results"
  on public.quiz_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own results"
  on public.quiz_results for insert
  with check (auth.uid() = user_id);

-- ---- Done! -------------------------------------------------
-- Now go to Authentication → Providers and enable Email auth
