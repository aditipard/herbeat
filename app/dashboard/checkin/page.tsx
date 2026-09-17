import { createClient } from "@/lib/supabase/server";
import { CheckinForm } from "@/components/CheckinForm";
import { getCycleContext, parseISODate, PHASES, toISODate } from "@/lib/cycle";

export const metadata = { title: "Check in · HerBeat" };
export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = toISODate(new Date());

  const [{ data: existing }, { data: profile }, { data: periods }] = await Promise.all([
    supabase.from("daily_checkins").select("*").eq("user_id", user!.id).eq("log_date", today).maybeSingle(),
    supabase.from("profiles").select("avg_cycle_length, avg_period_length").eq("id", user!.id).single(),
    supabase.from("periods").select("start_date").order("start_date", { ascending: false }).limit(1),
  ]);

  const ctx = getCycleContext(
    periods?.[0]?.start_date ? parseISODate(periods[0].start_date) : null,
    profile?.avg_cycle_length ?? 28,
    profile?.avg_period_length ?? 5
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 md:px-9 md:py-10">
      <header className="mb-8">
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ink">
          How are you today?
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-inkSoft">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          {ctx && ` · Day ${ctx.cycleDay}, ${PHASES[ctx.phase].label} phase`}
        </p>
      </header>

      <CheckinForm existing={existing} />
    </div>
  );
}
