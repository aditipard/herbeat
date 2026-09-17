/**
 * HERBEAT — CYCLE ENGINE
 *
 * Pure, dependency-free functions that turn logged period dates into a
 * day-by-day model of the four main cycle hormones.
 *
 * IMPORTANT — what this is and isn't:
 * These are *population-average curve shapes* scaled to the user's own
 * cycle length. They are an educational model of what typically happens
 * on a given cycle day, not a measurement of this user's actual hormone
 * levels. Nothing here is diagnostic. When the HerBeat wearable ships,
 * `buildHormoneSeries` is the single function that gets swapped to read
 * from `device_readings` instead of modelled values — every component
 * downstream consumes the same shape and won't need to change.
 */

export type PhaseKey = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface PhaseInfo {
  key: PhaseKey;
  label: string;
  colorVar: string;
  blurb: string;
  science: string;
}

export const PHASES: Record<PhaseKey, PhaseInfo> = {
  menstrual: {
    key: "menstrual",
    label: "Menstrual",
    colorVar: "var(--flow)",
    blurb: "Hormones are at their lowest. Rest is not laziness right now.",
    science:
      "Progesterone and estrogen have both dropped, which triggers the uterine lining to shed. Low estrogen can mean lower pain tolerance and lower energy. Iron stores dip with blood loss.",
  },
  follicular: {
    key: "follicular",
    label: "Follicular",
    colorVar: "var(--follicular)",
    blurb: "Estrogen climbing. Usually the easiest week to start things.",
    science:
      "FSH stimulates a cohort of follicles, and the dominant one produces rising estrogen. Rising estrogen supports serotonin activity, verbal fluency and muscle protein synthesis — which is why energy and mood often lift here.",
  },
  ovulatory: {
    key: "ovulatory",
    label: "Ovulatory",
    colorVar: "var(--ovulation)",
    blurb: "Peak estrogen and the LH surge. Your highest-output days.",
    science:
      "Estrogen peaks and triggers a sharp LH surge, which releases the egg roughly 24–36 hours later. Testosterone also nudges up. This is typically the peak for strength, confidence and social drive — and the fertile window.",
  },
  luteal: {
    key: "luteal",
    label: "Luteal",
    colorVar: "var(--luteal)",
    blurb: "Progesterone leads. Body temp up, nervous system more sensitive.",
    science:
      "The corpus luteum produces progesterone, which raises basal body temperature ~0.3°C and has a calming, sedative effect via GABA. Late luteal, both hormones fall — the drop is what drives PMS symptoms for many people.",
  },
};

export interface CycleContext {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  phase: PhaseKey;
  ovulationDay: number;
  daysUntilNextPeriod: number;
  nextPeriodDate: Date;
  fertileWindow: { start: number; end: number };
  isPredicted: boolean;
  daysSinceLastPeriod: number;
}

/** Days between two dates, ignoring time-of-day and timezone drift. */
export function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / ms);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Work out where the user is in their cycle today.
 * `lastPeriodStart` is the most recent logged period start date.
 */
export function getCycleContext(
  lastPeriodStart: Date | null,
  cycleLength = 28,
  periodLength = 5,
  today = new Date()
): CycleContext | null {
  if (!lastPeriodStart) return null;

  const len = clamp(cycleLength, 21, 45);
  const pLen = clamp(periodLength, 1, 10);

  const elapsed = daysBetween(lastPeriodStart, today);
  // Cycle day is 1-indexed. If they're past the expected length we roll over,
  // so the app degrades gracefully instead of showing "day 47".
  const cycleDay = ((elapsed % len) + len) % len + 1;
  const isPredicted = elapsed >= len; // they haven't logged the new period yet

  const ovulationDay = len - 14; // luteal phase is the stable ~14 days
  const daysUntilNextPeriod = len - cycleDay + 1;

  return {
    cycleDay,
    cycleLength: len,
    periodLength: pLen,
    phase: getPhase(cycleDay, len, pLen),
    ovulationDay,
    daysUntilNextPeriod,
    nextPeriodDate: addDays(today, daysUntilNextPeriod),
    fertileWindow: { start: ovulationDay - 5, end: ovulationDay + 1 },
    isPredicted,
    daysSinceLastPeriod: elapsed,
  };
}

export function getPhase(cycleDay: number, cycleLength = 28, periodLength = 5): PhaseKey {
  const ovulationDay = cycleLength - 14;
  if (cycleDay <= periodLength) return "menstrual";
  if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) return "ovulatory";
  if (cycleDay < ovulationDay - 1) return "follicular";
  return "luteal";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Gaussian bump, used to shape each hormone's rise and fall. */
function bump(x: number, center: number, width: number): number {
  return Math.exp(-((x - center) ** 2) / (2 * width ** 2));
}

export interface HormonePoint {
  day: number;
  estrogen: number;
  progesterone: number;
  lh: number;
  fsh: number;
  phase: PhaseKey;
}

/**
 * Build the full-cycle hormone series, normalised 0–100 per hormone.
 *
 * Curve shapes follow the standard textbook cycle, scaled to the user's
 * own cycle length so a 34-day cycle stretches correctly rather than
 * being squashed into a 28-day template:
 *   • Estrogen — slow follicular climb, sharp peak just before ovulation,
 *     dip, then a broader secondary luteal peak.
 *   • LH       — flat, then a narrow spike at ovulation.
 *   • FSH      — early follicular rise, small ovulatory bump.
 *   • Progesterone — near zero until ovulation, then a broad luteal dome
 *     that collapses right before menstruation.
 */
export function buildHormoneSeries(cycleLength = 28, periodLength = 5): HormonePoint[] {
  const len = clamp(cycleLength, 21, 45);
  const ov = len - 14;
  const points: HormonePoint[] = [];

  for (let day = 1; day <= len; day++) {
    const estrogen =
      88 * bump(day, ov - 1, Math.max(1.8, ov * 0.22)) +
      46 * bump(day, ov + 7, 4.2) +
      8;

    const lh = 96 * bump(day, ov, 0.95) + 6 * bump(day, ov + 1, 2) + 4;

    const fsh =
      42 * bump(day, 3, 3.4) + 34 * bump(day, ov, 1.3) + 12;

    // Progesterone is gated to the luteal phase, then decays into menses.
    const lutealProgress = (day - ov) / 14;
    const progesterone =
      day <= ov
        ? 4 + 3 * bump(day, ov, 2)
        : 4 + 92 * bump(day, ov + 7, 4.0) * (1 - Math.max(0, lutealProgress - 0.85) * 3);

    points.push({
      day,
      estrogen: round(clamp(estrogen, 0, 100)),
      progesterone: round(clamp(progesterone, 0, 100)),
      lh: round(clamp(lh, 0, 100)),
      fsh: round(clamp(fsh, 0, 100)),
      phase: getPhase(day, len, periodLength),
    });
  }
  return points;
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

/** Convert a series of points into a smooth SVG path using Catmull-Rom → Bézier. */
export function smoothPath(
  points: { x: number; y: number }[],
  tension = 0.5
): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(
      2
    )}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const MOODS = [
  { key: "great", label: "Great", emoji: "🌞" },
  { key: "good", label: "Good", emoji: "🙂" },
  { key: "okay", label: "Okay", emoji: "😐" },
  { key: "low", label: "Low", emoji: "🌧" },
  { key: "rough", label: "Rough", emoji: "⛈" },
] as const;

export const FLOW_LEVELS = [
  { key: "none", label: "None" },
  { key: "spotting", label: "Spotting" },
  { key: "light", label: "Light" },
  { key: "medium", label: "Medium" },
  { key: "heavy", label: "Heavy" },
] as const;

export const SYMPTOMS = [
  "Cramps",
  "Headache",
  "Bloating",
  "Breast tenderness",
  "Acne",
  "Back pain",
  "Nausea",
  "Fatigue",
  "Insomnia",
  "Food cravings",
  "Anxious",
  "Irritable",
  "Brain fog",
  "High libido",
  "Low libido",
] as const;
