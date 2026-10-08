import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  {
    id: 'maquina-empuje-cadera',
    name: 'Máquina de empuje de cadera con carga de discos',
    description:
      'Ejercicio compuesto de empuje en máquina, ideal para principiantes. Trabaja glúteos de forma intensa con femorales y core como estabilizadores.',
    primaryMuscle: 'gluteos',
    secondaryMuscles: ['femorales', 'core'],
    equipment: 'maquina',
    difficulty: 'principiante',
    instructions: [
      'Ajusta la máquina a tu altura, siéntate con la espalda contra el respaldo, rodillas flexionadas y pies apoyados planos sobre la plataforma.',
      'Activa el core, empuja con los talones y eleva las caderas, levantando el peso mientras aprietas los glúteos.',
      'Baja el peso lentamente hasta la posición inicial, manteniendo el movimiento bajo control; repite las repeticiones y series deseadas.',
    ],
    tips: [
      'Aprieta los glúteos arriba del movimiento, no hiperextiendas la espalda baja.',
      'Empuja con todo el pie, no solo con la punta.',
      'Mantén el core activado durante toda la repetición.',
    ],
    gifPath: '/GymAreliHaziel/exercises/maquina-empuje-cadera-1.mp4',
    extraMediaPaths: ['/GymAreliHaziel/exercises/maquina-empuje-cadera-2.mp4'],
    muscleImagePath: '/GymAreliHaziel/exercises/maquina-empuje-cadera-muscles.png',
  },
];

// Helpers
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISES.filter(
    (e) => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle as Exercise['primaryMuscle']),
  );
}