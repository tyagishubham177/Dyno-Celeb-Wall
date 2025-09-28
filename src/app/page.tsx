import Link from "next/link";

const featureBullets = [
  "Tap through head-to-head showdowns in seconds.",
  "Elo scores reshape a living 3D gallery in real time.",
  "Neon Postgres keeps every duel and delta in sync.",
];

export default function Home() {
  return (
    <section className="space-y-10">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-emerald-200">
          Wall of Fame
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
          Vote celebs head-to-head and watch the wall bend to your taste.
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Dyno keeps every duel tight: local-first input, battle-tested Elo math,
          and a fluid Three.js wall that resizes frames by confidence. This MVP
          lays the groundwork for the interactive leaderboard.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/rate"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Start rating
          </Link>
          <Link
            href="/wall"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40"
          >
            View the wall
          </Link>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {featureBullets.map((item) => (
          <li key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-lg shadow-emerald-500/5">
            {item}
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
          MVP scope
        </h2>
        <p>
          Single judge flow, Elo scoring with match-based K-factor, and a 3D wall
          powered by react-three-fiber. APIs expose duel selection, submission,
          and wall state. Neon Postgres stores truth & replay, while local storage
          keeps the UX snappy.
        </p>
      </div>
    </section>
  );
}
