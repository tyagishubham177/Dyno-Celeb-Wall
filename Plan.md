Here’s a **tight action plan**—no fluff, just moves.

# Wall of Fame — Three.js MVP (single user)

## 0) About
Wall of Fame is a slick, single-judge, Three.js-powered gallery where celebs duel in quick A/B taps and the wall literally reshapes itself in 3D. 🧱✨ Each vote updates an Elo score, frames resize by rank (with smart caps), and faces flow into artsy layouts—from neat small-n patterns to a golden-angle spiral for bigger casts. Minimal clicks, buttery animations, instant feedback; ties/skips are allowed, and all truth lives in Postgres. It’s part game, part living leaderboard, part interactive museum—your taste curates the space in real time. 🎭📈

## 1) Scope 🎯

* One judge does A/B picks → Elo updates → 3D “wall” reflows.
* Looks good from **2 → n** (use small-n templates, then spiral).
* Non-auth for now; local storage to avoid accidental double taps.

## 2) Stack 🧰

* **Next.js (Vercel)** for routing & APIs.
* **Three.js** render layer via **react-three-fiber** (+ drei) for fast UI wiring.
  *(If you want pure Three.js later, swap out the R3F component—same scene graph.)*
* **Neon Postgres (Vercel integration)** as the DB.
* Optional later: **Upstash Redis** cache (not needed for single user).

## 3) Data model (lean) 🗃️

* `celebs(id, name, image_url, elo int default 1200, matches int default 0, created_at)`
* `duels(id, celeb_a, celeb_b, winner, created_at)`
  *(single user → no user table)*

## 4) Ranking brain ⚙️

* **Elo** with shrinking K: `K = clamp(8..32, 32/√(matches+1))`.
* **Ties** = 0.5.
* **Conservative sort** for sizing: `elo - 40/√(matches+1)`.
* **New celeb placement**: quick **binary-insert** comparisons before normal flow.

## 5) API routes 🔌

* `GET /api/duel/next` → `{a,b}` (choose closest-elo + high uncertainty).
* `POST /api/duel/submit` → `{aId,bId,winner}` (updates Elo; returns deltas).
* `GET /api/wall` → array of `{id, name, image_url, elo, sizeHint}` for render.
  *(Cache with ISR 1–5 min; revalidate tag on submit.)*

## 6) Three.js scene 🎨

* **Canvas** full-screen; **OrbitControls** (zoom + slight pan).
* **Frames** = textured **Planes** (not Sprites; easier raycast & sizing).
* **Small-n (≤9)**: hand templates (2-diag, 3-triangle, 4-diamond, 5-plus, 6-flower).
* **n ≥ 10**: **phyllotaxis on a plane** (golden-angle), then tiny nudge to de-overlap.
* **Size** = logistic(mapped conservative score) → clamp `[64px, 320px]` in world units.
* **Animation**: tween **position & scale** on rank change (Framer-Motion-3D / R3F springs).
* **Raycaster**: hover shows name + rank; click opens profile modal (later).
* **Perf**: cap texture to **512px**, enable mipmaps, lazy-load, reuse materials.

## 7) UI flow 🧭

* `/admin/seed` (env-guarded): paste CSV names+URLs → insert.
* `/rate`: A/B pair card over the canvas (keyboard `A/B/T` for tie, `S` skip).
* `/wall`: the 3D wall; “Keep rating” CTA.
* LocalStorage: last seen pair & cooldown to avoid instant repeats.

## 8) Milestones 🗓️

**Day 1–2**

* Repo + Next + R3F setup; Neon DB; Drizzle/Prisma schema; `/admin/seed`.

**Day 3**

* Elo service + tests; `/api/duel/next` + `/api/duel/submit`; simple `/wall` JSON.

**Day 4**

* R3F small-n templates + textures; phyllotaxis layout for 10+.

**Day 5**

* Animations, hover labels, ISR + revalidate; deploy on Vercel.

**Day 6 (polish)**

* Broken-image fallback, CSV merge-dupe tool, basic analytics (Umami).

## 9) Guardrails & gotchas 🧯

* **Texture budget**: 100 celebs × 512px ≈ fine on mid GPUs; prefetch top-20 first.
* **SSR**: disable SSR for canvas; load R3F client-side.
* **Numerical drift**: cap Elo movement per vote (e.g., ±24).
* **Single user**: still log duels (audit/debug), but don’t over-engineer rate limits.

## 10) “Done” looks like ✅

* Seed 30–100 celebs → 20–50 votes → wall clearly re-sizes & re-flows smoothly.
* Page stays >50 FPS on a normal laptop; interactions feel instant (<200ms API).
