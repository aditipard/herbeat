import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingPulse } from "@/components/LandingPulse";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-inkSoft transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[var(--violet-deep)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-16">
        <h1 className="max-w-3xl font-display text-[clamp(2.6rem,6.5vw,4.6rem)] font-medium leading-[1.04] tracking-[-0.02em] text-ink">
          Your body runs on a rhythm. Learn to read it.
        </h1>
        <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-inkSoft">
          HerBeat turns the dates you log into a live picture of your hormones — so
          when your energy drops or your mood turns, you know which hormone is behind
          it and what actually helps.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-[var(--violet-deep)] px-7 py-3.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90"
          >
            Start tracking
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line px-7 py-3.5 text-[0.95rem] font-medium text-ink transition-colors hover:bg-[var(--violet-mist)]"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-xl border border-line bg-surface p-6 md:p-9">
          <LandingPulse />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-3">
          <div>
            <h2 className="font-display text-[1.45rem] text-ink">A check-in that takes seconds</h2>
            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-inkSoft">
              Mood, energy, flow and symptoms in a handful of taps. Fast enough that you
              actually do it every day, which is the only way the patterns show up.
            </p>
          </div>
          <div>
            <h2 className="font-display text-[1.45rem] text-ink">Habits in the same place</h2>
            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-inkSoft">
              Sleep, training, stress, caffeine. Logged beside your cycle, so you can see
              which of your own habits track with feeling good and which don't.
            </p>
          </div>
          <div>
            <h2 className="font-display text-[1.45rem] text-ink">Answers about your own data</h2>
            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-inkSoft">
              Ask why day 22 always flattens you, and get the endocrinology behind it —
              read against what you personally logged, not generic advice.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-inkFaint md:flex-row md:items-center md:justify-between">
          <Logo size={22} />
          <p className="max-w-md">
            HerBeat is for education and self-tracking. It does not diagnose conditions
            and is not a substitute for care from a clinician.
          </p>
        </div>
      </footer>
    </main>
  );
}
