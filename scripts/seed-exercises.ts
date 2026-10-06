import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { EXERCISES_SEED } from '../src/data/exercises.seed';

config({ path: '.env.local' });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or anon/service key in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const rows = EXERCISES_SEED.map((ex) => ({
    id: ex.id,
    name: ex.name,
    description: ex.description,
    primary_muscle: ex.primaryMuscle,
    secondary_muscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    instructions: ex.instructions,
    tips: ex.tips,
    gif_path: ex.gifPath,
  }));

  const { error } = await supabase.from('exercises').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Upserted ${rows.length} exercises.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});