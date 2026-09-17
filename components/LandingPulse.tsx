"use client";

import { PulseChart } from "@/components/PulseChart";

/** Live demo curve on the landing page, set to an average cycle. */
export function LandingPulse() {
  return <PulseChart cycleLength={28} periodLength={5} currentDay={14} />;
}
