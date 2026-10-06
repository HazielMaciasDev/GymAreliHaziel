-- Gym Guide — initial schema
-- Run this once on a fresh Supabase project.

create extension if not exists "pgcrypto";

-- Banco de ejercicios (curado)
create table if not exists public.exercises (
  id text primary key,
  name text not null,
  description text not null default '',
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null,
  difficulty text not null check (difficulty in ('principiante','intermedio','avanzado')),
  instructions text[] not null default '{}',
  tips text[] not null default '{}',
  gif_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exercises_primary_muscle_idx
  on public.exercises (primary_muscle);

-- Rutinas (una por perfil)
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null check (profile_id in ('haziel','areli')),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routines_profile_idx
  on public.routines (profile_id);

-- Ejercicios dentro de una rutina
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  position int not null default 0,
  sets int not null default 3 check (sets between 1 and 20),
  reps int not null default 10 check (reps between 1 and 100),
  weight_kg numeric(6,2),
  created_at timestamptz not null default now()
);

create index if not exists routine_exercises_routine_idx
  on public.routine_exercises (routine_id, position);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

-- Permissive policies (app familiar, sin auth real)
drop policy if exists "exercises read" on public.exercises;
create policy "exercises read" on public.exercises for select using (true);

drop policy if exists "exercises write" on public.exercises;
create policy "exercises write" on public.exercises for all using (true) with check (true);

drop policy if exists "routines all" on public.routines;
create policy "routines all" on public.routines for all using (true) with check (true);

drop policy if exists "routine_exercises all" on public.routine_exercises;
create policy "routine_exercises all" on public.routine_exercises
  for all using (true) with check (true);