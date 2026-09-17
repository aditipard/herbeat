"use client";

import { PHASES, getPhase, type PhaseKey } from "@/lib/cycle";

/** Circular cycle map — one ring, today marked. Echoes the logo's orbital form. */
export function PhaseRing({
  cycleDay, cycleLength, periodLength,
}: { cycleDay: number; cycleLength: number; periodLength: number }) {
  const size = 208;
  const cx = size / 2;
  const cy = size / 2;
  const r = 82;
  const stroke = 16;

  const segments = Array.from({ length: cycleLength }, (_, i) => {
    const day = i + 1;
    const phase: PhaseKey = getPhase(day, cycleLength, periodLength);
    const a0 = (day - 1) / cycleLength * Math.PI * 2 - Math.PI / 2;
    const a1 = day / cycleLength * Math.PI * 2 - Math.PI / 2;
    return { day, phase, a0, a1 };
  });

  const arc = (a0: number, a1: number) => {
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };

  const todayAngle = (cycleDay - 0.5) / cycleLength * Math.PI * 2 - Math.PI / 2;
  const phase = getPhase(cycleDay, cycleLength, periodLength);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={`Cycle day ${cycleDay} of ${cycleLength}, ${PHASES[phase].label} phase`}>
        {segments.map((s) => (
          <path
            key={s.day}
            d={arc(s.a0 + 0.012, s.a1 - 0.012)}
            stroke={PHASES[s.phase].colorVar}
            strokeWidth={stroke}
            strokeLinecap="butt"
            fill="none"
            opacity={s.day <= cycleDay ? 0.95 : 0.22}
          />
        ))}
        <circle
          cx={cx + r * Math.cos(todayAngle)}
          cy={cy + r * Math.sin(todayAngle)}
          r={7}
          fill="var(--surface)"
          stroke="var(--ink)"
          strokeWidth={2.5}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="var(--font-display)"
          fontSize="40" fill="var(--ink)">{cycleDay}</text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontFamily="var(--font-sans)"
          fontSize="12" fill="var(--ink-faint)">of {cycleLength} days</text>
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {(Object.keys(PHASES) as PhaseKey[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-inkSoft">
            <span className="h-2 w-2 rounded-full" style={{ background: PHASES[k].colorVar }} />
            {PHASES[k].label}
          </span>
        ))}
      </div>
    </div>
  );
}
