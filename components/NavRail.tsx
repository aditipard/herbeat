"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, CalendarCheck, NotebookPen, Sparkles, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/dashboard", label: "Cycle", Icon: Activity },
  { href: "/dashboard/checkin", label: "Check in", Icon: CalendarCheck },
  { href: "/dashboard/log", label: "Habits", Icon: NotebookPen },
  { href: "/dashboard/assistant", label: "Ask", Icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
];

export function NavRail({ displayName }: { displayName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-[15rem] shrink-0 flex-col border-r border-line px-5 py-6 md:flex">
        <Link href="/dashboard" className="mb-9 px-1">
          <Logo />
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5">
          {LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.92rem] font-medium transition-colors"
                style={{
                  background: active ? "var(--violet-mist)" : "transparent",
                  color: active ? "var(--violet-deep)" : "var(--ink-soft)",
                }}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line pt-4">
          {displayName && (
            <p className="mb-2 px-3 text-sm text-inkSoft">{displayName}</p>
          )}
          <button
            onClick={signOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-inkFaint transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface md:hidden">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-[0.68rem] font-medium transition-colors"
              style={{ color: active ? "var(--violet-deep)" : "var(--ink-faint)" }}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
