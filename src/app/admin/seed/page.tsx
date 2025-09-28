import Link from "next/link";

export default function AdminSeedPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Seed the roster</h1>
        <p className="text-sm text-slate-400">
          Paste CSV rows of name and image URL to populate the celebs table. The
          server action guarding this endpoint will verify an admin token before
          inserting records.
        </p>
      </header>
      <form className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-slate-200">CSV rows</span>
          <textarea
            rows={10}
            placeholder="name,image_url"
            className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-slate-200">Admin token</span>
          <input
            type="password"
            placeholder="Bearer secret"
            className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Seed entries
          </button>
          <Link
            href="/wall"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40"
          >
            Skip to wall
          </Link>
        </div>
      </form>
    </section>
  );
}
