import SeedForm from "./SeedForm";

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
      <SeedForm />
    </section>
  );
}
