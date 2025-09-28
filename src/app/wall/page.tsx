import dynamic from "next/dynamic";

const WallScene = dynamic(() => import("@/components/wall/WallScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 text-sm text-slate-400">
      Loading wall preview...
    </div>
  ),
});

export default function WallPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">3D Wall preview</h1>
        <p className="text-sm text-slate-400">
          This scene hydrates on the client via react-three-fiber. As we wire up
          real data, frames will resize based on conservative Elo scores and flow
          across templates or the phyllotaxis layout.
        </p>
      </header>
      <div className="h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
        <WallScene />
      </div>
    </section>
  );
}
