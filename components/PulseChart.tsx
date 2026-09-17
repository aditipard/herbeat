"use client";

import { useMemo, useState } from "react";
import { buildHormoneSeries, smoothPath, PHASES, type PhaseKey } from "@/lib/cycle";

const HORMONES = [
  { key: "estrogen", label: "Estrogen", color: "var(--follicular)" },
  { key: "progesterone", label: "Progesterone", color: "var(--luteal)" },
  { key: "lh", label: "LH", color: "var(--ovulation)" },
  { key: "fsh", label: "FSH", color: "var(--flow)" },
] as const;

type HormoneKey = (typeof HORMONES)[number]["key"];

interface Props {
  cycleLength: number;
  periodLength: number;
  currentDay: number | null;
}

/**
 * The pulse trace. Scrub across it to read any day of the cycle.
 * Interaction is pointer + keyboard driven; the only non-user-triggered
 * motion is the single draw-on of the curve at mount.
 */
export function PulseChart({ cycleLength, periodLength, currentDay }: Props) {
  const series = useMemo(
    () => buildHormoneSeries(cycleLength, periodLength),
    [cycleLength, periodLength]
  );
  const [active, setActive] = useState<Set<HormoneKey>>(
    new Set(["estrogen", "progesterone"])
  );
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const W = 860;
  const H = 300;
  const padL = 12;
  const padR = 12;
  const padT = 24;
  const padB = 34;

  const x = (day: number) =>
    padL + ((day - 1) / (series.length - 1)) * (W - padL - padR);
  const y = (value: number) => padT + (1 - value / 100) * (H - padT - padB);

  const paths = HORMONES.map((h) => ({
    ...h,
    d: smoothPath(series.map((p) => ({ x: x(p.day), y: y(p[h.key]) }))),
  }));

  const readDay = hoverDay ?? currentDay;
  const readPoint = readDay ? series.find((p) => p.day === readDay) : null;

  // Phase bands along the baseline
  const bands = useMemo(() => {
    const out: { phase: PhaseKey; from: number; to: number }[] = [];
    series.forEach((p) => {
      const last = out[out.length - 1];
      if (last && last.phase === p.phase) last.to = p.day;
      else out.push({ phase: p.phase, from: p.day, to: p.day });
    });
    return out;
  }, [series]);

  function toggle(key: HormoneKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else next.add(key);
      return next;
    });
  }

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const day = Math.round(
      ((rel - padL) / (W - padL - padR)) * (series.length - 1) + 1
    );
    setHoverDay(Math.min(series.length, Math.max(1, day)));
  }

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-display text-[2.6rem] leading-none text-ink">
            {readPoint ? `Day ${readPoint.day}` : "Your cycle"}
          </p>
          {readPoint && (
            <p className="mt-1.5 text-sm text-inkSoft">
              {PHASES[readPoint.phase].label} phase
              {hoverDay && hoverDay !== currentDay && " · scrubbing"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HORMONES.map((h) => {
            const on = active.has(h.key);
            return (
              <button
                key={h.key}
                onClick={() => toggle(h.key)}
                aria-pressed={on}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] font-medium transition-colors"
                style={{
                  background: on ? "var(--violet-mist)" : "transparent",
                  color: on ? "var(--ink)" : "var(--ink-faint)",
                  border: `1px solid ${on ? "transparent" : "var(--line)"}`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: on ? h.color : "var(--ink-faint)" }}
                />
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        style={{ height: "auto" }}
        onPointerMove={handlePointer}
        onPointerLeave={() => setHoverDay(null)}
        role="img"
        aria-label={`Modelled hormone levels across a ${cycleLength} day cycle`}
      >
        <defs>
          {HORMONES.map((h) => (
            <linearGradient key={h.key} id={`fill-${h.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={h.color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={h.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* phase bands */}
        {bands.map((b) => (
          <rect
            key={`${b.phase}-${b.from}`}
            x={x(b.from) - 2}
            y={H - padB + 10}
            width={Math.max(2, x(b.to) - x(b.from) + 4)}
            height={5}
            rx={2.5}
            fill={PHASES[b.phase].colorVar}
            opacity={0.85}
          />
        ))}

        {/* fertile window marker */}
        <rect
          x={x(Math.max(1, cycleLength - 19))}
          y={padT}
          width={x(cycleLength - 13) - x(Math.max(1, cycleLength - 19))}
          height={H - padT - padB}
          fill="var(--ovulation)"
          opacity={0.05}
        />

        {/* today marker */}
        {currentDay && (
          <line
            x1={x(currentDay)}
            x2={x(currentDay)}
            y1={padT - 6}
            y2={H - padB}
            stroke="var(--violet)"
            strokeWidth="1.5"
            strokeDasharray="3 4"
            opacity={0.6}
          />
        )}

        {/* hover scrub line */}
        {hoverDay && (
          <line
            x1={x(hoverDay)}
            x2={x(hoverDay)}
            y1={padT - 6}
            y2={H - padB}
            stroke="var(--ink-faint)"
            strokeWidth="1"
          />
        )}

        {/* the curves */}
        {paths.map(
          (p) =>
            active.has(p.key) && (
              <g key={p.key}>
                <path
                  d={`${p.d} L ${x(series.length)} ${H - padB} L ${x(1)} ${H - padB} Z`}
                  fill={`url(#fill-${p.key})`}
                />
                <path
                  className="pulse-line"
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )
        )}

        {/* read-out dots */}
        {readPoint &&
          HORMONES.filter((h) => active.has(h.key)).map((h) => (
            <circle
              key={h.key}
              cx={x(readPoint.day)}
              cy={y(readPoint[h.key])}
              r="5"
              fill="var(--surface)"
              stroke={h.color}
              strokeWidth="2.5"
            />
          ))}

        {/* day axis */}
        {series
          .filter((p) => p.day === 1 || p.day % 7 === 0 || p.day === series.length)
          .map((p) => (
            <text
              key={p.day}
              x={x(p.day)}
              y={H - 6}
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink-faint)"
              fontFamily="var(--font-sans)"
            >
              {p.day}
            </text>
          ))}
      </svg>

      {readPoint && (
        <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
          {HORMONES.filter((h) => active.has(h.key)).map((h) => (
            <div key={h.key} className="flex items-baseline gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
              <span className="text-sm text-inkSoft">{h.label}</span>
              <span className="text-sm font-semibold tabular-nums text-ink">
                {readPoint[h.key]}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 max-w-prose text-xs leading-relaxed text-inkFaint">
        These curves model the typical shape of each hormone across a cycle of your
        length. They show what usually happens on a given day, not a measurement of
        your levels.
      </p>
    </div>
  );
}
