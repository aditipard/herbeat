"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toISODate } from "@/lib/cycle";

/** One-tap "my period started" — the single most important action in the app. */
export function LogPeriodButton() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toISODate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Your session expired. Sign in again."); setSaving(false); return; }

    const { error } = await supabase.from("periods").insert({ user_id: user.id, start_date: date });
    setSaving(false);
    if (error) { setError("Couldn't save that. Try again."); return; }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--flow)] px-6 py-3 text-[0.92rem] font-medium text-white transition-opacity hover:opacity-90"
      >
        Period started
      </button>
    );
  }

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <label htmlFor="pstart" className="mb-2 block text-sm font-medium text-ink">
        First day of this period
      </label>
      <input
        id="pstart" type="date" value={date} max={toISODate(new Date())}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-[var(--violet)]"
      />
      {error && <p className="mt-2 text-xs text-[var(--flow)]">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={save} disabled={saving}
          className="rounded-full bg-[var(--flow)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-sm text-inkSoft hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}
