"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toISODate } from "@/lib/cycle";

/** Lifestyle log. Same speed principle as the check-in: steppers, not keyboards. */
export function HabitForm({ existing }: { existing: any | null }) {
  const router = useRouter();
  const supabase = createClient();

  const [sleep, setSleep] = useState<number>(existing?.sleep_hours ?? 7);
  const [exercise, setExercise] = useState<number>(existing?.exercise_minutes ?? 0);
  const [stress, setStress] = useState<number>(existing?.stress_level ?? 3);
  const [water, setWater] = useState<number>(existing?.water_glasses ?? 0);
  const [caffeine, setCaffeine] = useState<number>(existing?.caffeine_servings ?? 0);
  const [alcohol, setAlcohol] = useState<number>(existing?.alcohol_servings ?? 0);
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Your session expired. Sign in again."); setSaving(false); return; }

    const { error } = await supabase.from("habit_logs").upsert(
      {
        user_id: user.id,
        log_date: toISODate(new Date()),
        sleep_hours: sleep,
        exercise_minutes: exercise,
        stress_level: stress,
        water_glasses: water,
        caffeine_servings: caffeine,
        alcohol_servings: alcohol,
        notes: notes.slice(0, 1000) || null,
      },
      { onConflict: "user_id,log_date" }
    );

    setSaving(false);
    if (error) { setError("Couldn't save your log. Try again."); return; }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-8">
      <Stepper label="Sleep" value={sleep} onChange={setSleep} min={0} max={14} step={0.5} unit="hours" />
      <Stepper label="Exercise" value={exercise} onChange={setExercise} min={0} max={240} step={15} unit="minutes" />

      <div>
        <p className="mb-3 text-[1.05rem] font-medium text-ink">Stress</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n} onClick={() => setStress(n)} aria-pressed={stress === n}
              aria-label={`Stress ${n} of 5`}
              className="h-12 flex-1 rounded-md border text-sm font-semibold transition-colors"
              style={{
                borderColor: stress === n ? "transparent" : "var(--line)",
                background: stress === n ? "var(--luteal)" : "var(--surface)",
                color: stress === n ? "#fff" : "var(--ink-faint)",
              }}
            >{n}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-inkFaint">1 is calm, 5 is stretched thin.</p>
      </div>

      <Stepper label="Water" value={water} onChange={setWater} min={0} max={20} step={1} unit="glasses" />
      <Stepper label="Caffeine" value={caffeine} onChange={setCaffeine} min={0} max={10} step={1} unit="drinks" />
      <Stepper label="Alcohol" value={alcohol} onChange={setAlcohol} min={0} max={15} step={1} unit="drinks" />

      <div>
        <p className="mb-3 text-[1.05rem] font-medium text-ink">What did today look like?</p>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000}
          placeholder="Big deadline, long walk, skipped lunch — whatever stands out."
          className="w-full resize-none rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none placeholder:text-inkFaint focus:border-[var(--violet)]"
        />
      </div>

      {error && <p className="rounded-md bg-[var(--flow-soft)] px-4 py-3 text-sm text-[var(--flow)]">{error}</p>}

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving}
          className="rounded-full bg-[var(--violet-deep)] px-8 py-3.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : existing ? "Update log" : "Save log"}
        </button>
        {saved && <span className="text-sm font-medium text-[var(--violet-deep)]">Saved</span>}
      </div>
    </div>
  );
}

function Stepper({
  label, value, onChange, min, max, step, unit,
}: {
  label: string; value: number; onChange: (n: number) => void;
  min: number; max: number; step: number; unit: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[1.05rem] font-medium text-ink">{label}</p>
        <p className="font-display text-[1.5rem] text-[var(--violet-deep)]">
          {value} <span className="text-sm text-inkSoft">{unit}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`Decrease ${label}`}
          className="h-11 w-11 shrink-0 rounded-full border border-line text-lg text-ink transition-colors hover:bg-[var(--violet-mist)]"
        >−</button>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="w-full accent-[var(--violet-deep)]"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          aria-label={`Increase ${label}`}
          className="h-11 w-11 shrink-0 rounded-full border border-line text-lg text-ink transition-colors hover:bg-[var(--violet-mist)]"
        >+</button>
      </div>
    </div>
  );
}
