import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const metadata = { title: "Set up HerBeat" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("onboarding_complete").eq("id", user.id).single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  return <OnboardingFlow userId={user.id} />;
}
