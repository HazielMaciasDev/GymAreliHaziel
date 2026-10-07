import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  // Plantilla — agregar/editar entradas según los videos que subas a public/exercises/.
  // gifPath usa SIEMPRE la base del sitio (/GymAreliHaziel/) seguida de la ruta pública.
  {
    id: 'sentadilla',
    name: 'Sentadilla con barra',
    description:
      'Ejercicio compuesto rey del tren inferior. Trabaja cuádriceps, glúteos y femorales de forma sincronizada.',
    primaryMuscle: 'cuadriceps',
    secondaryMuscles: ['gluteos', 'femorales', 'core'],
    equipment: 'barra',
    difficulty: 'intermedio',
    instructions: [
      'Parate con los pies al ancho de los hombros, barra apoyada en los trapecios.',
      'Activá el core, mantené el pecho alto y la mirada al frente.',
      'Bajá controlado flexionando cadera y rodillas hasta que los muslos queden paralelos al suelo.',
      'Empujá el piso con los talones para volver a la posición inicial.',
    ],
    tips: [
      'Las rodillas deben seguir la línea de los pies, sin colapsar hacia adentro.',
      'Mantené el peso en los talones y el puente del pie, no en la punta.',
      'La espalda baja se mantiene neutra durante todo el movimiento.',
    ],
    gifPath: '/GymAreliHaziel/exercises/sentadilla.mp4',
  },
  {
    id: 'press-banca',
    name: 'Press de banca plano',
    description:
      'Ejercicio compuesto fundamental para el tren superior. Trabaja pecho, hombros y tríceps.',
    primaryMuscle: 'pecho',
    secondaryMuscles: ['triceps', 'hombros'],
    equipment: 'barra',
    difficulty: 'intermedio',
    instructions: [
      'Acuéstate en el banco y apoya los pies firmes en el suelo.',
      'Agarra la barra con las manos ligeramente más abiertas que el ancho de los hombros.',
      'Desciende la barra de forma controlada hasta rozar el pecho.',
      'Empuja la barra hacia arriba en línea recta hasta extender los codos sin bloquear.',
    ],
    tips: [
      'Mantené los omóplatos retraídos y la espalda baja apoyada en el banco.',
      'No rebotes la barra en el pecho.',
      'Mantené los glúteos en contacto con el banco.',
    ],
    gifPath: '/GymAreliHaziel/exercises/press-banca.mp4',
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