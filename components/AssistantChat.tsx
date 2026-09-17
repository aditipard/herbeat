"use client";

import { useEffect, useRef, useState } from "react";

interface Msg { role: "user" | "assistant"; content: string }

const STARTERS = [
  "Why am I so tired right now?",
  "What's actually happening in my body today?",
  "How should I train this week?",
  "Look at my logs — do you see any patterns?",
];

export function AssistantChat({ phaseLabel, cycleDay }: { phaseLabel: string | null; cycleDay: number | null }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeMyData, setIncludeMyData] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-10),
          includeMyData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Couldn't reach the assistant. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col md:h-[calc(100vh-7rem)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {messages.length === 0 ? (
          <div className="pt-4">
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ink">
              Ask about your cycle
            </h1>
            <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-inkSoft">
              {cycleDay
                ? `You're on day ${cycleDay}${phaseLabel ? `, in your ${phaseLabel.toLowerCase()} phase` : ""}. Ask anything about what that means — or about your own logged data.`
                : "Log a period first and answers can be tailored to where you are in your cycle."}
            </p>
            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-line bg-surface px-5 py-4 text-left text-[0.92rem] text-ink transition-colors hover:bg-[var(--violet-mist)]"
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className="max-w-[46rem] whitespace-pre-wrap text-[0.96rem] leading-relaxed"
                  style={
                    m.role === "user"
                      ? {
                          background: "var(--violet-mist)",
                          color: "var(--ink)",
                          padding: "0.85rem 1.1rem",
                          borderRadius: "14px 14px 3px 14px",
                        }
                      : { color: "var(--ink)" }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1.5 py-2" aria-label="Thinking">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full animate-pulseGlow"
                    style={{ background: "var(--violet)", animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-[var(--flow-soft)] px-4 py-3 text-sm text-[var(--flow)]">{error}</p>
      )}

      <div className="border-t border-line pt-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Ask about a symptom, a phase, or your own data…"
            className="max-h-36 flex-1 resize-none rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none placeholder:text-inkFaint focus:border-[var(--violet)]"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="rounded-full bg-[var(--violet-deep)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >Send</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-inkSoft">
            <input
              type="checkbox"
              checked={includeMyData}
              onChange={(e) => setIncludeMyData(e.target.checked)}
              className="accent-[var(--violet-deep)]"
            />
            Use my logged data to personalise answers
          </label>
          <p className="text-xs text-inkFaint">
            Educational only — not a diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
