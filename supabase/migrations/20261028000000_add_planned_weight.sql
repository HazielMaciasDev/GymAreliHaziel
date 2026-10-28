-- Peso planificado por ejercicio en la rutina semanal.
-- La app escribe series/reps/peso antes de la sesión; la sesión los usa como
-- valores iniciales y puede actualizarlos y devolverlos a la plantilla.
alter table public.weekly_routine
  add column if not exists default_weight_kg numeric;
