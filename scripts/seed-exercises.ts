import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { FALLBACK_EXERCISES } from '../src/data/fallback';

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

  const rows = FALLBACK_EXERCISES.map((ex: {
    id: string;
    name: string;
    description: string;
    primaryMuscle: string;
    secondaryMuscles: string[];
    equipment: string;
    difficulty: string;
    instructions: string[];
    tips: string[];
    gifPath: string;
  }) => ({
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

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});