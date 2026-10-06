# Gym Guide

App web responsive para que **Haziel** y **Areli** armen y ejecuten rutinas de gym a partir de un banco de ejercicios curado (con GIFs que ustedes suben).

Diseñada con el sistema visual de `DESIGN.md` (paleta Wise: verde bosque + lime, pills, tipografía display Inter 900).

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS v4 con `@theme` mapeado a tokens del DESIGN.md
- Supabase (Postgres) — banco de ejercicios y rutinas
- `@dnd-kit` para drag-and-drop de la rutina
- Sin auth: selector de perfil local (localStorage)

## Estructura

```
src/
├── app/
│   ├── layout.tsx              # root layout con ProfileGate
│   ├── page.tsx                # selector de perfil
│   ├── workouts/
│   │   ├── page.tsx            # constructor de rutinas (banco + DnD)
│   │   └── active/page.tsx     # modo ejecución con checklist
├── components/                  # UI kit + componentes gym
├── data/exercises.seed.ts      # ~15 ejercicios iniciales
├── hooks/                       # useProfile
├── lib/                        # supabase, muscles, profiles, format
└── types/                      # tipos compartidos

public/exercises/                # aquí van los GIFs (súbanlos ustedes)
supabase/migrations/            # 001_init.sql
```

## Setup local

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local con tu URL y anon key de Supabase
npm run dev
```

## Cargar GIFs

1. Sube cada GIF a `public/exercises/<slug>.gif`. El `slug` debe coincidir con el `id` del ejercicio (ver `src/data/exercises.seed.ts`).
2. La app ya referencia esos paths automáticamente.

## Aplicar migración y sembrar ejercicios

```bash
# Aplica el schema (una vez):
# Usa el MCP o pega 001_init.sql en SQL Editor de Supabase Studio.

# Sube el banco inicial a Supabase:
npm run seed
```

## Decisiones pendientes

- La persistencia de rutinas aún es **local (sessionStorage) en esta versión**. Migrar a Supabase es trivial: ya están los hooks y tipos listos en `src/lib/supabase.ts`.
- Cuando agreguen más ejercicios, editen `src/data/exercises.seed.ts` y corran `npm run seed` de nuevo.