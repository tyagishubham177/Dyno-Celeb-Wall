import { getDb, schema } from "@/db";
import RosterTable from "./ui/RosterTable";

export const dynamic = "force-dynamic";

export default async function AdminRosterPage() {
  const db = getDb();
  const roster = await db
    .select({ id: schema.celebs.id, name: schema.celebs.name, imageUrl: schema.celebs.imageUrl, elo: schema.celebs.elo, matches: schema.celebs.matches })
    .from(schema.celebs);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Manage roster</h1>
        <p className="text-sm text-slate-400">Edit names and image links, or delete celebs. Protected by the same admin token used for seeding.</p>
      </header>
      <RosterTable roster={roster} />
    </section>
  );
}

