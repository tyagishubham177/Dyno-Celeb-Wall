export default function RatePage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Pick your favorite</h1>
        <p className="text-sm text-slate-400">
          The rating flow will surface two celebs with similar Elo and higher
          uncertainty. For now this placeholder outlines the UI shell that will
          host the duel controls and keyboard shortcuts.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {["A", "B"].map((label) => (
          <article
            key={label}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center"
          >
            <div className="h-48 w-48 rounded-2xl border border-white/10 bg-slate-800" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-100">
                Contestant {label}
              </h2>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Elo TBD
              </p>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Choose {label}
            </button>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/30 p-4 text-xs text-slate-400">
        Keyboard shortcuts coming soon: A / B to vote, T to tie, S to skip.
      </div>
    </section>
  );
}
