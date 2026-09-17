import { createClient } from "@/lib/supabase/server";
import { AssistantChat } from "@/components/AssistantChat";
import { getCycleContext, parseISODate, PHASES } from "@/lib/cycle";

export const metadata = { title: "Ask · HerBeat" };
export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: periods }] = await Promise.all([
    supabase.from("profiles").select("avg_cycle_length, avg_period_length").eq("id", user!.id).single(),
    supabase.from("periods").select("start_date").order("start_date", { ascending: false }).limit(1),
  ]);

  const ctx = getCycleContext(
    periods?.[0]?.start_date ? parseISODate(periods[0].start_date) : null,
    profile?.avg_cycle_length ?? 28,
    profile?.avg_period_length ?? 5
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-7 md:px-9 md:py-10">
      <AssistantChat
        phaseLabel={ctx ? PHASES[ctx.phase].label : null}
        cycleDay={ctx?.cycleDay ?? null}
      />
    </div>
  );
}
