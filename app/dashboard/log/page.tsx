import { createClient } from "@/lib/supabase/server";
import { HabitForm } from "@/components/HabitForm";
import { HabitHistory } from "@/components/HabitHistory";
import { toISODate } from "@/lib/cycle";

export const metadata = { title: "Habits · HerBeat" };
export const dynamic = "force-dynamic";

export default async function LogPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = toISODate(new Date());

  const [{ data: existing }, { data: history }] = await Promise.all([
    supabase.from("habit_logs").select("*").eq("user_id", user!.id).eq("log_date", today).maybeSingle(),
    supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(30),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 md:px-9 md:py-10">
      <header className="mb-8">
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ink">
          What did today hold?
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-inkSoft">
          Logged beside your cycle, these turn into patterns you can actually act on.
        </p>
      </header>

      <HabitForm existing={existing} />

      {history && history.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-[1.35rem] text-ink">Last 30 days</h2>
          <HabitHistory logs={history} />
        </section>
      )}
    </div>
  );
}
