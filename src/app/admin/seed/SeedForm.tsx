"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  initialSeedState,
  seedRosterAction,
  type SeedActionState,
} from "./actions";

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Seeding..." : "Seed entries"}
    </button>
  );
};

const buildAlertStyles = (state: SeedActionState) => {
  if (state.status === "success") {
    return "border border-emerald-400/50 bg-emerald-500/10 text-emerald-200";
  }

  if (state.status === "error") {
    return "border border-rose-400/50 bg-rose-500/10 text-rose-200";
  }

  return "border border-white/10 bg-slate-900/50 text-slate-300";
};

const SeedForm = () => {
  const [state, formAction] = useFormState(seedRosterAction, initialSeedState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6"
    >
      <label className="block space-y-2 text-sm">
        <span className="font-semibold text-slate-200">CSV rows</span>
        <textarea
          name="csv"
          rows={10}
          placeholder="name,image_url"
          className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-400 focus:outline-none"
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-semibold text-slate-200">Admin token</span>
        <input
          name="token"
          type="password"
          placeholder="Bearer secret"
          autoComplete="off"
          className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-emerald-400 focus:outline-none"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton />
        <Link
          href="/wall"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40"
        >
          Skip to wall
        </Link>
      </div>
      {state.message ? (
        <div className={`rounded-xl px-4 py-3 text-xs ${buildAlertStyles(state)}`}>
          <div className="font-semibold uppercase tracking-[0.3em]">
            {state.status === "success"
              ? "Seed complete"
              : state.status === "error"
                ? "Seed failed"
                : "Seed status"}
          </div>
          <p className="mt-2 leading-relaxed">{state.message}</p>
          {state.status === "success" && typeof state.inserted === "number" ? (
            <p className="mt-2 text-[11px] text-slate-300">
              Inserted {state.inserted} entr{state.inserted === 1 ? "y" : "ies"}
              {typeof state.skipped === "number" && state.skipped > 0
                ? `, skipped ${state.skipped} duplicate/invalid row${state.skipped === 1 ? "" : "s"}.`
                : "."}
            </p>
          ) : null}
          {state.warnings && state.warnings.length > 0 ? (
            <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
              {state.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
};

export default SeedForm;
