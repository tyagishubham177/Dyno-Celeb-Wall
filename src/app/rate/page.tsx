import RateClient from "./RateClient";

export default function RatePage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Pick your favorite</h1>
        <p className="text-sm text-slate-400">
          The rating flow pairs celebs with similar Elo and higher uncertainty. Cast
          votes, mark ties, or skip matchups; local storage guards against duplicate
          submissions, and keyboard shortcuts keep the taps fast.
        </p>
      </header>
      <RateClient />
    </section>
  );
}
