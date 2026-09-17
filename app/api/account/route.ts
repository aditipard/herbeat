import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deletes the caller's auth record.
 *
 * This is the only place a service-role key is used, and it is used narrowly:
 * the caller's identity is established from their own verified session first,
 * and the only id ever passed to the admin API is that same user's id. The key
 * is read from the server environment and is never exposed to the browser.
 *
 * Rows in the app tables are removed by ON DELETE CASCADE.
 */
export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Account deletion isn't configured on the server." },
      { status: 503 }
    );
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Account deletion failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete the account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
