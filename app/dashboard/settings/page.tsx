import { createClient } from "@/lib/supabase/server";
import { SettingsPanel } from "@/components/SettingsPanel";

export const metadata = { title: "Settings · HerBeat" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 md:px-9 md:py-10">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ink">Settings</h1>
      <p className="mt-1.5 text-[0.95rem] text-inkSoft">{user!.email}</p>
      <SettingsPanel profile={profile} />
    </div>
  );
}
