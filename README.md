# Gym Guide

App web responsive para que **Haziel** y **Areli** armen y ejecuten rutinas de gym a partir de un banco de ejercicios curado (con GIFs que ustedes suben).

Diseñada con el sistema visual de `DESIGN.md` (paleta Wise: verde bosque + lime, pills, tipografía display Inter 900).

## Stack

- Next.js 14 (App Router) · React 18 · Tailwind v4 con `@theme` mapeado al `DESIGN.md`
- `@dnd-kit` para drag-and-drop
- Supabase (Postgres) — banco de ejercicios y rutinas
- Sin auth: selector de perfil local (localStorage)
- Static export a GitHub Pages

## Estructura

```
src/
├── app/
│   ├── layout.tsx · globals.css · page.tsx              # selector de perfil
│   └── workouts/
│       ├── page.tsx                                     # constructor DnD
│       └── active/page.tsx                              # modo ejecución
├── components/                                          # UI kit + gym
├── data/exercises.seed.ts                               # 15 ejercicios iniciales
├── hooks/useProfile.ts
├── lib/                                                 # supabase, muscles, profiles, format
└── types/index.ts

public/exercises/                                        # aquí van los GIFs (subanlos ustedes)
supabase/migrations/001_init.sql                         # schema + RLS
.github/workflows/deploy.yml                            # build + deploy a GitHub Pages
```

## Setup local

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local con tu URL y anon key de Supabase
npm run dev
```

## Build estático (GitHub Pages)

```bash
npm run build       # genera ./out
```

## Cargar GIFs

1. Sube cada GIF a `public/exercises/<slug>.gif`. El slug debe coincidir con el `id` del ejercicio (ver `src/data/exercises.seed.ts`).
2. La app ya referencia esos paths automáticamente.

## Aplicar migración y poblar Supabase

```bash
# 1) Aplica el schema (una vez) desde el SQL Editor de Studio o vía supabase_apply_migration
# 2) Sube el banco inicial:
npm run seed
```

## Deploy a GitHub Pages

El workflow `.github/workflows/deploy.yml` se dispara en cada push a `main`, compila el static export y lo publica en la branch `gh-pages`.

**Setup inicial en el repo:**

1. **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** · `/ (root)`
2. (Opcional) **Settings → Secrets and variables → Actions** — solo si querés que el build incluya las claves de Supabase:
   - Variable `NEXT_PUBLIC_SUPABASE_URL` = `https://fhtormfuavagjahlvgji.supabase.co`
   - Secret `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (clave anon)
3. Push a `main` (o `Actions → Deploy to GitHub Pages → Run workflow`).

URL resultante: `https://hazielmaciasdev.github.io/GymAreliHaziel/`

## Notas

- Las rutinas se persisten en `sessionStorage` en esta versión (se pierden al cerrar la pestaña). Migrar a Supabase es directo con los hooks en `src/lib/supabase.ts`.
- Cuando agreguen más ejercicios, editen `src/data/exercises.seed.ts` y corran `npm run seed`.