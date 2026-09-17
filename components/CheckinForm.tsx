"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MOODS, FLOW_LEVELS, SYMPTOMS, toISODate } from "@/lib/cycle";
import { NotificationOptIn } from "@/components/NotificationOptIn";

/**
 * The daily check-in. Everything is a tap; the only typing is the optional
 * note. Designed to be finishable in under fifteen seconds, because a
 * check-in people skip is worse than no check-in at all.
 */
export function CheckinForm({ existing }: { existing: any | null }) {
  const router = useRouter();
  const supabase = createClient();

  const [mood, setMood] = useState<string>(existing?.mood ?? "");
  const [energy, setEnergy] = useState<number>(existing?.energy ?? 0);
  const [flow, setFlow] = useState<string>(existing?.flow ?? "none");
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSymptom(s: string) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Your session expired. Sign in again."); setSaving(false); return; }

    const { error } = await supabase.from("daily_checkins").upsert(
      {
        user_id: user.id,
        log_date: toISODate(new Date()),
        mood: mood || null,
        energy: energy || null,
        flow,
        symptoms,
        notes: notes.slice(0, 1000) || null,
      },
      { onConflict: "user_id,log_date" }
    );

    setSaving(false);
    if (error) { setError("Couldn't save your check-in. Try again."); return; }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-9">
      <Field label="How's your mood?">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              aria-pressed={mood === m.key}
              className="flex flex-col items-center gap-1.5 rounded-md border px-5 py-3.5 transition-colors"
              style={{
                borderColor: mood === m.key ? "var(--violet)" : "var(--line)",
                background: mood === m.key ? "var(--violet-mist)" : "var(--surface)",
              }}
            >
              <span className="text-[1.4rem]" aria-hidden="true">{m.emoji}</span>
              <span className="text-[0.8rem] font-medium text-ink">{m.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Energy">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setEnergy(n)}
              aria-label={`Energy ${n} of 5`}
              aria-pressed={energy === n}
              className="h-12 flex-1 rounded-md border text-sm font-semibold transition-colors"
              style={{
                borderColor: energy >= n ? "transparent" : "var(--line)",
                background: energy >= n ? "var(--violet)" : "var(--surface)",
                color: energy >= n ? "#fff" : "var(--ink-faint)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Flow">
        <div className="flex flex-wrap gap-2">
          {FLOW_LEVELS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFlow(f.key)}
              aria-pressed={flow === f.key}
              className="rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderColor: flow === f.key ? "transparent" : "var(--line)",
                background: flow === f.key ? "var(--flow)" : "var(--surface)",
                color: flow === f.key ? "#fff" : "var(--ink)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Anything you're feeling?" hint="Tap all that apply.">
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const on = symptoms.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                aria-pressed={on}
                className="rounded-full border px-4 py-2 text-sm transition-colors"
                style={{
                  borderColor: on ? "var(--violet)" : "var(--line)",
                  background: on ? "var(--violet-mist)" : "var(--surface)",
                  color: "var(--ink)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Note" hint="Optional.">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Anything worth remembering about today."
          className="w-full resize-none rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none placeholder:text-inkFaint focus:border-[var(--violet)]"
        />
      </Field>

      {error && (
        <p className="rounded-md bg-[var(--flow-soft)] px-4 py-3 text-sm text-[var(--flow)]">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[var(--violet-deep)] px-8 py-3.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : existing ? "Update check-in" : "Save check-in"}
        </button>
        {saved && <span className="text-sm font-medium text-[var(--violet-deep)]">Saved</span>}
      </div>

      <NotificationOptIn />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[1.05rem] font-medium text-ink">{label}</p>
      {hint && <p className="mb-3 text-sm text-inkFaint">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </div>
  );
}
