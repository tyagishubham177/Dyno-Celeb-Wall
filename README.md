# Dyno Wall of Fame

A Three.js powered, Elo-driven celebrity wall where head-to-head votes reshape a 3D gallery in real time. This repository currently hosts the MVP scaffolding: Next.js app router, Tailwind styling, react-three-fiber scene shell, and Neon/Postgres wiring via Drizzle ORM.

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the example environment and update secrets
   ```bash
   cp .env.example .env.local
   ```
3. Run the dev server
   ```bash
   npm run dev
   ```

## Available scripts

- `npm run dev` – start Next.js in development mode
- `npm run build` – create a production build
- `npm run lint` – lint the codebase with ESLint
- `npm run typecheck` – run TypeScript without emitting files
- `npm run db:generate` – generate Drizzle migrations
- `npm run db:push` – push the latest schema to the database
- `npm run db:studio` – open the Drizzle Studio dashboard

## Project structure

- `src/app` – app router routes (`/`, `/wall`, `/rate`, `/admin/seed`)
- `src/components` – UI and scene components (`WallScene` placeholder)
- `src/db` – Drizzle schema and Neon client helper
- `src/lib` – shared utilities (Elo math, env helpers)
- `drizzle/` – generated SQL artifacts (empty placeholder committed for now)

## Roadmap

- Implement duel selection (`GET /api/duel/next`) and submission (`POST /api/duel/submit`)
- Connect react-three-fiber scene to live wall data with sizing/animations
- Build the `/admin/seed` server action with CSV ingestion and auth guard
- Add local storage guardrails to avoid duplicate votes
- Deploy on Vercel with Neon database and optional ISR for the wall endpoint
