"use client";

import { useState } from "react";

const METRICS = [
  { key: "sleep_hours", label: "Sleep", unit: "h", color: "var(--luteal)" },
  { key: "exercise_minutes", label: "Exercise", unit: "min", color: "var(--follicular)" },
  { key: "stress_level", label: "Stress", unit: "/5", color: "var(--flow)" },
] as const;

/** Simple bar history so trends are visible without leaving the page. */
export function HabitHistory({ logs }: { logs: any[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("sleep_hours");
  const active = METRICS.find((m) => m.key === metric)!;
  const ordered = [...logs].reverse();
  const max = Math.max(...ordered.map((l) => Number(l[metric]) || 0), 1);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key} onClick={() => setMetric(m.key)} aria-pressed={metric === m.key}
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: metric === m.key ? "var(--violet-mist)" : "transparent",
              color: metric === m.key ? "var(--ink)" : "var(--ink-faint)",
              border: `1px solid ${metric === m.key ? "transparent" : "var(--line)"}`,
            }}
          >{m.label}</button>
        ))}
      </div>
      <div className="flex h-32 items-end gap-1">
        {ordered.map((l) => {
          const v = Number(l[metric]) || 0;
          return (
            <div
              key={l.log_date}
              className="flex-1 rounded-sm"
              style={{
                height: `${Math.max(3, (v / max) * 100)}%`,
                background: active.color,
                opacity: v ? 0.85 : 0.18,
              }}
              title={`${l.log_date}: ${v}${active.unit}`}
            />
          );
        })}
      </div>
    </div>
  );
}
