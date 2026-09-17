import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT, isLikelyOffDomain } from "@/lib/assistant-prompt";
import { getCycleContext, PHASES, parseISODate } from "@/lib/cycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      })
    )
    .max(20)
    .default([]),
  includeMyData: z.boolean().default(true),
});

/**
 * In-memory rate limit: 20 messages per user per 10 minutes.
 * Prevents a stolen session from burning the API key. For multi-instance
 * production, move this to Supabase or Upstash Redis — noted in the README.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimit(userId: string) {
  const now = Date.now();
  const b = buckets.get(userId);
  if (!b || now > b.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: LIMIT - 1 };
  }
  if (b.count >= LIMIT) return { ok: false, remaining: 0 };
  b.count += 1;
  return { ok: true, remaining: LIMIT - b.count };
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limit = rateLimit(user.id);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "You've hit the message limit for now. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "That message couldn't be read." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet. Add ANTHROPIC_API_KEY to your environment." },
      { status: 503 }
    );
  }

  if (isLikelyOffDomain(body.message)) {
    return NextResponse.json({
      reply:
        "I only cover hormonal and cycle health, so I'll have to skip that one. I can help with what's happening in your current phase, why a symptom shows up when it does, or what your logged data is showing — want to start there?",
    });
  }

  // ── Build the user's data context (only if they opted in) ───────────────
  let dataContext = "";
  if (body.includeMyData) {
    const [{ data: profile }, { data: periods }, { data: checkins }, { data: habits }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("periods").select("*").order("start_date", { ascending: false }).limit(6),
        supabase
          .from("daily_checkins")
          .select("*")
          .order("log_date", { ascending: false })
          .limit(30),
        supabase.from("habit_logs").select("*").order("log_date", { ascending: false }).limit(30),
      ]);

    const lastPeriod = periods?.[0]?.start_date ? parseISODate(periods[0].start_date) : null;
    const ctx = getCycleContext(
      lastPeriod,
      profile?.avg_cycle_length ?? 28,
      profile?.avg_period_length ?? 5
    );

    const lines: string[] = ["## THIS USER'S HERBEAT DATA"];

    if (ctx) {
      lines.push(
        `Today: cycle day ${ctx.cycleDay} of ~${ctx.cycleLength}. Phase: ${PHASES[ctx.phase].label}. Next period expected in ${ctx.daysUntilNextPeriod} days.`
      );
    } else {
      lines.push("No period logged yet, so cycle day is unknown.");
    }

    if (profile?.lifestyle && Object.keys(profile.lifestyle).length) {
      lines.push(`Lifestyle profile: ${JSON.stringify(profile.lifestyle)}`);
    }
    if (profile?.tracking_goal) lines.push(`Their goal: ${profile.tracking_goal}`);

    if (checkins?.length) {
      lines.push("Recent check-ins (most recent first):");
      checkins.slice(0, 14).forEach((c: any) => {
        const parts = [c.log_date];
        if (c.mood) parts.push(`mood ${c.mood}`);
        if (c.energy) parts.push(`energy ${c.energy}/5`);
        if (c.flow && c.flow !== "none") parts.push(`flow ${c.flow}`);
        if (c.symptoms?.length) parts.push(`symptoms: ${c.symptoms.join(", ")}`);
        lines.push(`  - ${parts.join(" | ")}`);
      });
    } else {
      lines.push("No daily check-ins logged yet.");
    }

    if (habits?.length) {
      lines.push("Recent lifestyle logs:");
      habits.slice(0, 14).forEach((h: any) => {
        const parts = [h.log_date];
        if (h.sleep_hours != null) parts.push(`sleep ${h.sleep_hours}h`);
        if (h.exercise_minutes != null) parts.push(`exercise ${h.exercise_minutes}min`);
        if (h.stress_level != null) parts.push(`stress ${h.stress_level}/5`);
        if (h.caffeine_servings != null) parts.push(`caffeine ${h.caffeine_servings}`);
        lines.push(`  - ${parts.join(" | ")}`);
      });
    }

    dataContext = lines.join("\n");
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: dataContext ? `${SYSTEM_PROMPT}\n\n${dataContext}` : SYSTEM_PROMPT,
      messages: [
        ...body.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: body.message },
      ],
    });

    const reply = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply, remaining: limit.remaining });
  } catch (err) {
    // Never leak provider errors or key details to the client.
    console.error("Assistant error:", err);
    return NextResponse.json(
      { error: "The assistant couldn't respond just now. Try again in a moment." },
      { status: 502 }
    );
  }
}
