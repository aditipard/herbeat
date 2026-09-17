"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { toISODate } from "@/lib/cycle";

/**
 * Five short steps. Each screen asks one thing, because a long form is the
 * fastest way to lose someone before they ever see their first curve.
 */

const GOALS = [
  { key: "understand", label: "Understand my body better" },
  { key: "symptoms", label: "Manage symptoms and PMS" },
  { key: "performance", label: "Train and work with my cycle" },
  { key: "fertility", label: "Track fertility" },
  { key: "irregular", label: "Figure out why I'm irregular" },
];

const SLEEP = ["Under 6 hours", "6–7 hours", "7–8 hours", "8+ hours"];
const EXERCISE = ["Rarely", "1–2 times a week", "3–4 times a week", "5+ times a week"];
const STRESS = ["Low and steady", "Manageable", "Often stressed", "Constantly stretched"];
const WORK = ["Desk-based", "On my feet", "Shift work", "Varies a lot"];

export function OnboardingFlow({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [lastPeriod, setLastPeriod] = useState(toISODate(new Date()));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [goal, setGoal] = useState<string>("");
  const [sleep, setSleep] = useState("");
  const [exercise, setExercise] = useState("");
  const [stress, setStress] = useState("");
  const [work, setWork] = useState("");

  const steps = ["You", "Your cycle", "Your goal", "Your days", "Done"];

  async function finish() {
    setSaving(true);
    setError(null);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: name || null,
        avg_cycle_length: cycleLength,
        avg_period_length: periodLength,
        tracking_goal: goal || null,
        lifestyle: { sleep, exercise, stress, work },
        onboarding_complete: true,
      })
      .eq("id", userId);

    if (profileError) {
      setSaving(false);
      setError("Couldn't save your profile. Check your connection and try again.");
      return;
    }

    const { error: periodError } = await supabase.from("periods").insert({
      user_id: userId,
      start_date: lastPeriod,
    });

    setSaving(false);

    if (periodError) {
      setError("Saved your profile, but couldn't log that period date.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const canAdvance = [
    true,
    Boolean(lastPeriod),
    Boolean(goal),
    Boolean(sleep && exercise && stress && work),
    true,
  ][step];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
      <Logo />

      <div className="mt-8 flex gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        {steps.map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i <= step ? "var(--violet)" : "var(--line)" }}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center py-12">
        {step === 0 && (
          <Step title="First, what should we call you?" sub="Optional — it just makes the app feel less like a spreadsheet.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full max-w-sm rounded-md border border-line bg-surface px-4 py-3.5 text-[1.05rem] text-ink outline-none focus:border-[var(--violet)]"
            />
          </Step>
        )}

        {step === 1 && (
          <Step
            title="When did your last period start?"
            sub="This anchors everything else. A rough guess is fine — you can correct it any time."
          >
            <input
              type="date"
              value={lastPeriod}
              max={toISODate(new Date())}
              onChange={(e) => setLastPeriod(e.target.value)}
              className="w-full max-w-xs rounded-md border border-line bg-surface px-4 py-3.5 text-[1.05rem] text-ink outline-none focus:border-[var(--violet)]"
            />
            <div className="mt-8 space-y-6">
              <Slider
                label="Usual cycle length"
                value={cycleLength}
                min={21}
                max={40}
                unit="days"
                onChange={setCycleLength}
                hint="Day 1 of one period to the day before the next."
              />
              <Slider
                label="Usual period length"
                value={periodLength}
                min={1}
                max={10}
                unit="days"
                onChange={setPeriodLength}
              />
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="What brought you here?" sub="This shapes what the assistant focuses on.">
            <ChoiceGrid options={GOALS.map((g) => g.label)} value={goal} onChange={setGoal} />
          </Step>
        )}

        {step === 3 && (
          <Step title="How do your days usually go?" sub="Four quick ones. This is what lets HerBeat give advice that fits your actual life.">
            <div className="space-y-6">
              <ChoiceRow label="Sleep on an average night" options={SLEEP} value={sleep} onChange={setSleep} />
              <ChoiceRow label="Exercise" options={EXERCISE} value={exercise} onChange={setExercise} />
              <ChoiceRow label="Stress levels" options={STRESS} value={stress} onChange={setStress} />
              <ChoiceRow label="Your work day" options={WORK} value={work} onChange={setWork} />
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title={name ? `You're set, ${name}.` : "You're set."}
            sub="Your cycle is mapped. Check in once a day and the patterns start showing up within a cycle or two."
          >
            {error && (
              <p className="rounded-md bg-[var(--flow-soft)] px-4 py-3 text-sm text-[var(--flow)]">{error}</p>
            )}
          </Step>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-full px-5 py-3 text-sm font-medium text-inkSoft transition-colors hover:text-ink disabled:invisible"
        >
          Back
        </button>
        <button
          onClick={() => (step === 4 ? finish() : setStep((s) => s + 1))}
          disabled={!canAdvance || saving}
          className="rounded-full bg-[var(--violet-deep)] px-8 py-3.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {step === 4 ? (saving ? "Setting up…" : "Open my dashboard") : "Continue"}
        </button>
      </div>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-tight text-ink">{title}</h1>
      {sub && <p className="mt-3 max-w-lg text-[0.98rem] leading-relaxed text-inkSoft">{sub}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Slider({
  label, value, min, max, unit, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; unit: string;
  onChange: (n: number) => void; hint?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-ink">{label}</label>
        <span className="font-display text-[1.4rem] text-[var(--violet-deep)]">
          {value} <span className="text-sm text-inkSoft">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--violet-deep)]"
      />
      {hint && <p className="mt-1.5 text-xs text-inkFaint">{hint}</p>}
    </div>
  );
}

function ChoiceGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className="rounded-md border px-5 py-4 text-left text-[0.95rem] transition-colors"
          style={{
            borderColor: value === o ? "var(--violet)" : "var(--line)",
            background: value === o ? "var(--violet-mist)" : "var(--surface)",
            color: "var(--ink)",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ChoiceRow({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className="rounded-full border px-4 py-2.5 text-sm transition-colors"
            style={{
              borderColor: value === o ? "var(--violet)" : "var(--line)",
              background: value === o ? "var(--violet-mist)" : "var(--surface)",
              color: "var(--ink)",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
