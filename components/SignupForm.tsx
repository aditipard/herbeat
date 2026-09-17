"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Client-side strength check. Supabase enforces its own minimum server-side too. */
function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 12) issues.push("at least 12 characters");
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) issues.push("upper and lower case");
  if (!/[0-9]/.test(pw)) issues.push("a number");
  return issues;
}

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const issues = passwordIssues(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (issues.length) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is on, there's no session yet.
    if (data.session) router.push("/onboarding");
    else setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h1 className="font-display text-[2rem] leading-tight text-ink">Check your email</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-inkSoft">
          We sent a confirmation link to {email}. Open it to finish setting up your
          account.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[2.1rem] leading-tight text-ink">
        Create your account
      </h1>
      <p className="mt-2.5 text-[0.95rem] leading-relaxed text-inkSoft">
        Your cycle data is private to you. It is never sold, never shared, and you can
        delete all of it in one click.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-inkFaint focus:border-[var(--violet)]"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-describedby="pw-hint"
            className="w-full rounded-md border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors focus:border-[var(--violet)]"
          />
          <p
            id="pw-hint"
            className="mt-1.5 text-xs"
            style={{
              color:
                touched && issues.length ? "var(--flow)" : "var(--ink-faint)",
            }}
          >
            {issues.length
              ? `Needs ${issues.join(", ")}.`
              : "Strong password."}
          </p>
        </div>

        {error && (
          <p className="rounded-md bg-[var(--flow-soft)] px-4 py-3 text-sm text-[var(--flow)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--violet-deep)] px-6 py-3.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-inkSoft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--violet-deep)] underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
