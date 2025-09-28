import WallPreview from "./WallPreview";

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
      <WallPreview />
    </section>
  );
}
