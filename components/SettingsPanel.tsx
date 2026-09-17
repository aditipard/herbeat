"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SettingsPanel({ profile }: { profile: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(profile?.display_name ?? "");
  const [cycleLength, setCycleLength] = useState(profile?.avg_cycle_length ?? 28);
  const [periodLength, setPeriodLength] = useState(profile?.avg_period_length ?? 5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name || null,
        avg_cycle_length: cycleLength,
        avg_period_length: periodLength,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) { setMessage("Couldn't save those changes."); return; }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  /** Export everything as JSON. Health data should always be portable. */
  async function exportData() {
    const [periods, checkins, habits] = await Promise.all([
      supabase.from("periods").select("*"),
      supabase.from("daily_checkins").select("*"),
      supabase.from("habit_logs").select("*"),
    ]);
    const blob = new Blob(
      [JSON.stringify({
        exported_at: new Date().toISOString(),
        profile,
        periods: periods.data,
        daily_checkins: checkins.data,
        habit_logs: habits.data,
      }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `herbeat-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Deletes every row this user owns. The auth record is removed server-side. */
  async function deleteEverything() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setMessage(null);

    await Promise.all([
      supabase.from("daily_checkins").delete().eq("user_id", profile.id),
      supabase.from("habit_logs").delete().eq("user_id", profile.id),
      supabase.from("periods").delete().eq("user_id", profile.id),
      supabase.from("ai_messages").delete().eq("user_id", profile.id),
      supabase.from("ai_conversations").delete().eq("user_id", profile.id),
      supabase.from("device_readings").delete().eq("user_id", profile.id),
    ]);

    const res = await fetch("/api/account", { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setMessage("Your data was deleted, but the account record couldn't be removed. Contact support.");
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="mt-9 space-y-10">
      <section>
        <h2 className="font-display text-[1.4rem] text-ink">Your cycle</h2>
        <div className="mt-4 space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">Name</label>
            <input
              id="name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full max-w-sm rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none focus:border-[var(--violet)]"
            />
          </div>
          <Range label="Average cycle length" value={cycleLength} min={21} max={40} unit="days" onChange={setCycleLength} />
          <Range label="Average period length" value={periodLength} min={1} max={10} unit="days" onChange={setPeriodLength} />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button onClick={saveProfile} disabled={saving}
            className="rounded-full bg-[var(--violet-deep)] px-7 py-3 text-[0.92rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm font-medium text-[var(--violet-deep)]">Saved</span>}
        </div>
      </section>

      <section className="border-t border-line pt-9">
        <h2 className="font-display text-[1.4rem] text-ink">Your data</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-inkSoft">
          Everything you log belongs to you. Download a full copy any time.
        </p>
        <button onClick={exportData}
          className="mt-4 rounded-full border border-line px-6 py-3 text-[0.92rem] font-medium text-ink transition-colors hover:bg-[var(--violet-mist)]">
          Download my data
        </button>
      </section>

      <section className="border-t border-line pt-9">
        <h2 className="font-display text-[1.4rem] text-ink">Delete your account</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-inkSoft">
          This erases your profile, every period, check-in and habit log, and your account
          itself. It cannot be undone.
        </p>
        <label htmlFor="confirm" className="mt-4 block text-sm text-inkSoft">
          Type DELETE to confirm
        </label>
        <input
          id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1.5 w-full max-w-xs rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none focus:border-[var(--flow)]"
        />
        {message && <p className="mt-3 text-sm text-[var(--flow)]">{message}</p>}
        <button
          onClick={deleteEverything}
          disabled={confirmText !== "DELETE" || deleting}
          className="mt-4 rounded-full bg-[var(--flow)] px-6 py-3 text-[0.92rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {deleting ? "Deleting…" : "Delete everything"}
        </button>
      </section>
    </div>
  );
}

function Range({
  label, value, min, max, unit, onChange,
}: { label: string; value: number; min: number; max: number; unit: string; onChange: (n: number) => void }) {
  return (
    <div className="max-w-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-ink">{label}</label>
        <span className="font-display text-[1.25rem] text-[var(--violet-deep)]">
          {value} <span className="text-sm text-inkSoft">{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--violet-deep)]" aria-label={label} />
    </div>
  );
}
