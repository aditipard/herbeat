"use client";

import { MOODS, parseISODate } from "@/lib/cycle";

const MOOD_HEIGHT: Record<string, number> = {
  great: 1, good: 0.8, okay: 0.55, low: 0.35, rough: 0.18,
};

/** Fourteen-day glance at mood and energy. Empty days read as gaps, not zeros. */
export function RecentStrip({ checkins }: { checkins: any[] }) {
  if (!checkins.length) {
    return (
      <p className="text-[0.95rem] text-inkSoft">
        Nothing logged yet. Your first check-in starts the pattern.
      </p>
    );
  }

  const byDate = new Map(checkins.map((c) => [c.log_date, c]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { date: d, iso, entry: byDate.get(iso) };
  });

  return (
    <div className="flex items-end gap-1.5">
      {days.map(({ date, iso, entry }) => {
        const h = entry?.mood ? MOOD_HEIGHT[entry.mood] ?? 0.5 : 0;
        const mood = MOODS.find((m) => m.key === entry?.mood);
        return (
          <div key={iso} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end">
              {entry ? (
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${Math.max(12, h * 100)}%`,
                    background: `var(--violet)`,
                    opacity: 0.35 + h * 0.65,
                  }}
                  title={`${iso}: ${mood?.label ?? "logged"}`}
                />
              ) : (
                <div className="h-1.5 w-full rounded-sm bg-line" title={`${iso}: not logged`} />
              )}
            </div>
            <span className="text-[0.65rem] text-inkFaint">
              {date.toLocaleDateString(undefined, { weekday: "narrow" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
