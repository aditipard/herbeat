import { createClient } from "@/lib/supabase/server";
import { getCycleContext, parseISODate, PHASES, toISODate } from "@/lib/cycle";
import { PulseChart } from "@/components/PulseChart";
import { PhaseRing } from "@/components/PhaseRing";
import { LogPeriodButton } from "@/components/LogPeriodButton";
import { RecentStrip } from "@/components/RecentStrip";
import Link from "next/link";

export const metadata = { title: "Your cycle · HerBeat" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: periods }, { data: checkins }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("periods").select("*").order("start_date", { ascending: false }).limit(12),
    supabase.from("daily_checkins").select("*").order("log_date", { ascending: false }).limit(14),
  ]);

  const cycleLength = profile?.avg_cycle_length ?? 28;
  const periodLength = profile?.avg_period_length ?? 5;
  const lastStart = periods?.[0]?.start_date ? parseISODate(periods[0].start_date) : null;
  const ctx = getCycleContext(lastStart, cycleLength, periodLength);
  const phase = ctx ? PHASES[ctx.phase] : null;

  const todayISO = toISODate(new Date());
  const checkedInToday = checkins?.some((c: any) => c.log_date === todayISO) ?? false;

  return (
    <div className="mx-auto max-w-5xl px-5 py-7 md:px-9 md:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ink">
            {profile?.display_name ? `Hi, ${profile.display_name}` : "Your cycle"}
          </h1>
          {ctx && (
            <p className="mt-1.5 text-[0.95rem] text-inkSoft">
              {ctx.isPredicted
                ? `${ctx.daysSinceLastPeriod} days since your last period started`
                : `Day ${ctx.cycleDay} · ${phase!.label} phase · next period in ${ctx.daysUntilNextPeriod} ${ctx.daysUntilNextPeriod === 1 ? "day" : "days"}`}
            </p>
          )}
        </div>
        <LogPeriodButton />
      </header>

      {ctx?.isPredicted && (
        <div className="mb-6 rounded-md border border-line bg-[var(--flow-soft)] px-5 py-4">
          <p className="text-[0.92rem] text-ink">
            Your period was expected {ctx.daysSinceLastPeriod - ctx.cycleLength}{" "}
            {ctx.daysSinceLastPeriod - ctx.cycleLength === 1 ? "day" : "days"} ago. Log it when
            it starts so your predictions stay accurate. Cycles vary — but if you go three
            months without one, that&rsquo;s worth raising with a clinician.
          </p>
        </div>
      )}

      {!checkedInToday && (
        <Link
          href="/dashboard/checkin"
          className="mb-6 flex items-center justify-between rounded-md border border-line bg-surface px-5 py-4 transition-colors hover:bg-[var(--violet-mist)]"
        >
          <span className="text-[0.95rem] font-medium text-ink">
            You haven&rsquo;t checked in today
          </span>
          <span className="text-sm font-medium text-[var(--violet-deep)]">Takes 15 seconds</span>
        </Link>
      )}

      <section className="rounded-xl border border-line bg-surface p-5 md:p-8">
        <PulseChart
          cycleLength={cycleLength}
          periodLength={periodLength}
          currentDay={ctx?.cycleDay ?? null}
        />
      </section>

      {ctx && phase && (
        <section className="mt-6 grid gap-5 md:grid-cols-[auto,1fr]">
          <div className="rounded-xl border border-line bg-surface p-6">
            <PhaseRing
              cycleDay={ctx.cycleDay}
              cycleLength={ctx.cycleLength}
              periodLength={ctx.periodLength}
            />
          </div>
          <div className="rounded-xl border border-line bg-surface p-6 md:p-7">
            <h2 className="font-display text-[1.5rem] leading-snug text-ink">
              {phase.blurb}
            </h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-inkSoft">{phase.science}</p>
            <Link
              href="/dashboard/assistant"
              className="mt-5 inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[var(--violet-mist)]"
            >
              Ask what this means for me
            </Link>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-[1.35rem] text-ink">Last two weeks</h2>
        <RecentStrip checkins={checkins ?? []} />
      </section>
    </div>
  );
}
