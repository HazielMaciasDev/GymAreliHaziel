# Ejercicios propios

Subí acá tus videos (`.mp4`, `.webm` o `.gif`).

## Cómo agregar un ejercicio

1. **Subí el video** a esta carpeta vía la web de GitHub:
   - [github.com/HazielMaciasDev/GymAreliHaziel/tree/main/public/exercises](https://github.com/HazielMaciasDev/GymAreliHaziel/tree/main/public/exercises)
   - "Add file" → "Upload files" → arrastrá el archivo → commit.
   - El deploy se dispara solo en cada push.

2. **Agregá una entrada** al catálogo en `src/data/exercises.ts`:

```ts
{
  id: 'sentadilla',
  name: 'Sentadilla con barra',
  description: 'Ejercicio compuesto rey del tren inferior.',
  primaryMuscle: 'cuadriceps',
  secondaryMuscles: ['gluteos', 'femorales', 'core'],
  equipment: 'barra',
  difficulty: 'intermedio',
  instructions: [
    'Parate con los pies al ancho de los hombros.',
    'Bajá controlado flexionando cadera y rodillas.',
    'Empujá el piso con los talones para subir.',
  ],
  tips: [
    'Las rodillas siguen la línea de los pies.',
    'Mantené el peso en los talones.',
  ],
  gifPath: '/GymAreliHaziel/exercises/sentadilla.mp4',
},
```

## Convenciones

- **Nombres de archivo**: `slug-kebab-case` (ej. `press-banca.mp4`).
- **gifPath**: SIEMPRE arranca con `/GymAreliHaziel/exercises/` + nombre del archivo.
- **Formatos soportados**: `.mp4`, `.webm`, `.gif`. Para `.gif` se renderiza como imagen, el resto como `<video>` con autoplay/mute/loop.
- **Tamaño recomendado**: < 5 MB por video (apunta a 720p, ~3-5 segundos).

## Grupos musculares válidos

`pecho`, `espalda`, `hombros`, `biceps`, `triceps`, `antebrazos`, `core`, `oblicuos`, `cuadriceps`, `femorales`, `gluteos`, `gemelos`, `trapecio`, `dorsales`.

## Equipamiento válido

`barra`, `mancuerna`, `maquina`, `polea`, `peso-corporal`, `kettlebell`, `banda`.