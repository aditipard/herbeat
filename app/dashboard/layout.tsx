import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavRail } from "@/components/NavRail";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("onboarding_complete, display_name").eq("id", user.id).single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <NavRail displayName={profile.display_name} />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}
