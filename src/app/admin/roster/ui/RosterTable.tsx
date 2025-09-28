"use client";

import { useFormState } from "react-dom";
import { deleteCelebAction, updateCelebAction } from "../actions";

type Props = {
  roster: Array<{ id: number; name: string; imageUrl: string; elo: number; matches: number }>;
};

const Row = ({ entry }: { entry: Props["roster"][number] }) => {
  const [updateState, updateAction] = useFormState(updateCelebAction, { status: "idle" as const });
  const [deleteState, deleteAction] = useFormState(deleteCelebAction, { status: "idle" as const });

  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <form action={updateAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={entry.id} />
        <label className="flex-1 min-w-[180px] text-xs">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Name</span>
          <input name="name" defaultValue={entry.name} className="w-full rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" />
        </label>
        <label className="flex-[2] min-w-[260px] text-xs">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Image URL</span>
          <input name="imageUrl" defaultValue={entry.imageUrl} className="w-full rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" />
        </label>
        <label className="min-w-[180px] text-xs">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Admin token</span>
          <input name="token" type="password" placeholder="token" className="w-full rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none" />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button type="submit" className="rounded-full border border-emerald-300/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 hover:border-emerald-200">
            Save
          </button>
        </div>
        {updateState.message ? (
          <p className={`w-full text-[11px] ${updateState.status === "success" ? "text-emerald-300" : updateState.status === "error" ? "text-rose-300" : "text-slate-300"}`}>
            {updateState.message}
          </p>
        ) : null}
      </form>
      <form action={deleteAction} className="mt-2 flex items-center gap-2">
        <input type="hidden" name="id" value={entry.id} />
        <input name="token" type="password" placeholder="Admin token" className="w-40 rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 focus:border-rose-400 focus:outline-none" />
        <button type="submit" className="rounded-full border border-rose-300/60 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100 hover:border-rose-200">
          Delete
        </button>
        {deleteState.message ? (
          <p className={`text-[11px] ${deleteState.status === "success" ? "text-emerald-300" : deleteState.status === "error" ? "text-rose-300" : "text-slate-300"}`}>
            {deleteState.message}
          </p>
        ) : null}
      </form>
    </li>
  );
};

const RosterTable = ({ roster }: Props) => {
  if (!roster.length) {
    return <p className="text-sm text-slate-400">No celebs yet. Seed some first.</p>;
  }

  return (
    <ul className="space-y-3">
      {roster.map((entry) => (
        <Row key={entry.id} entry={entry} />
      ))}
    </ul>
  );
};

export default RosterTable;
