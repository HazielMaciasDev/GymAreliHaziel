# Gym Guide

App web responsive para que **Haziel** y **Areli** armen y ejecuten rutinas de gym a partir del banco de ejercicios de [WorkoutX](https://workoutxapp.com).

SPA hecha con **Vite + React 18 + Tailwind v4** · deploy a GitHub Pages en `https://hazielmaciasdev.github.io/GymAreliHaziel/`.

## Stack

- Vite 8 (build & dev server)
- React 18.3 + TypeScript
- Tailwind v4 con `@theme` mapeado al sistema visual de `DESIGN.md`
- `@dnd-kit` para reordenar la rutina
- `@workoutx/sdk` para el banco de ejercicios + GIFs
- Sin Next.js, sin SSR, sin hidratación = **no hay forma de que tire el error #418/#423**

## Estructura

```
src/
├── main.tsx                   # entry point (Vite)
├── App.tsx                    # router SPA (basado en pathname)
├── routes/
│   ├── WorkoutsPage.tsx       # /workouts (constructor)
│   └── ActiveWorkoutPage.tsx  # /workouts/active (modo ejecución)
├── components/                # UI kit + gym
├── data/fallback.ts           # banco hardcoded de red (si SDK no responde)
├── hooks/
│   ├── useProfile.ts          # localStorage: gym.profile
│   └── useExercises.ts        # SDK + cache sessionStorage (5min TTL)
├── lib/
│   ├── workoutx.ts            # cliente singleton
│   ├── sdk-exercises.ts       # adapter SDK → Exercise type, mapeo músculos/equipment
│   ├── router.ts              # useRouter / usePathname propio
│   ├── muscles.ts             # taxonomy 14 músculos
│   └── profiles.ts            # Haziel / Areli
└── types/index.ts
```

## Setup local

```bash
npm install
npm run dev          # http://localhost:5173/GymAreliHaziel/
```

(Build con `npm run build` → `dist/`.)

## Deploy

El workflow `.github/workflows/deploy.yml` corre en cada push a `main`:

1. `npm ci`
2. `npx tsc --noEmit` (typecheck)
3. `npm run build` (Vite genera `dist/`)
4. `cp dist/index.html dist/404.html` (fallback SPA para rutas profundas)
5. `peaceiris/actions-gh-pages@v4` publica `dist/` en la branch `gh-pages`

**Setup en GitHub Pages:**

Settings → Pages → Source: **Deploy from a branch** / Branch: **gh-pages** / `/ (root)`.

URL: `https://hazielmaciasdev.github.io/GymAreliHaziel/`

## Rutas

- `/GymAreliHaziel/` → selector de perfil
- `/GymAreliHaziel/workouts/` → constructor de rutina
- `/GymAreliHaziel/workouts/active/` → modo ejecución

Como es SPA, navegar directo a una ruta profunda funciona gracias al `404.html` fallback: GitHub Pages devuelve `404.html`, que es el mismo `index.html` de la SPA, que lee `window.location.pathname` y muestra la ruta correcta.

## Persistencia

- **Perfil** (Haziel / Areli): `localStorage.gym.profile`
- **Rutina semanal**: tabla `weekly_routine` en Supabase, cacheada en `localStorage.gym.routine.<perfil>.v2`
- **Sesión activa**: tablas `sessions` / `exercise_logs` / `set_logs` en Supabase
- **Catálogo de ejercicios**: `src/data/exercises.ts` (estático, versionado en git)

## Base de datos

Migraciones en `supabase/migrations/`. La última aplicada:

| Migración | Qué hace |
|---|---|
| `20261028000000_add_planned_weight.sql` | Agrega `weekly_routine.default_weight_kg` (peso planificado por ejercicio) |

Las series/reps/peso de cada ejercicio de la semana se configuran **antes** de entrenar
(desde `/routine`) y la sesión los usa como valores iniciales. Durante la sesión se puede
corregir cualquier set (inclusive uno ya marcado), agregar o quitar series, reordenar los
ejercicios y devolver todo a la plantilla con **Guardar en la rutina**.

## Ejercicios

Los videos viven en `public/exercises/` con el patrón `<slug>-1.mp4`, `<slug>-2.mp4` y
`<slug>-muscles.png`. Los Carpeta de origen (`ejerciciosAreli/`, `ejerciciosHaziel/`) están en
`.gitignore`: son la fuente local para copiar la media y armar la entrada del catálogo.

Al cambiar el nombre de un ejercicio hay que actualizar también su `id` en
`src/data/exercises.ts` **y** las referencias en la base (`weekly_routine.exercise_id` y
`exercise_logs.exercise_id`), para que la rutina y el historial sigan apuntando bien.
