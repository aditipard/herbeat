"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link_expired" ? "That link has expired. Sign in below." : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      // Deliberately generic: don't reveal whether the email exists.
      setError("That email and password don't match. Try again.");
      return;
    }

    const next = params.get("next");
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-[2.1rem] leading-tight text-ink">Welcome back</h1>
      <p className="mt-2.5 text-[0.95rem] text-inkSoft">Pick up where your cycle left off.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
          <input
            id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-inkFaint focus:border-[var(--violet)]"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Password</label>
          <input
            id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors focus:border-[var(--violet)]"
          />
        </div>

        {error && (
          <p className="rounded-md bg-[var(--flow-soft)] px-4 py-3 text-sm text-[var(--flow)]">{error}</p>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full rounded-full bg-[var(--violet-deep)] px-6 py-3.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-inkSoft">
        New here?{" "}
        <Link href="/signup" className="font-medium text-[var(--violet-deep)] underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
