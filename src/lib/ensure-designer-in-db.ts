import type { SupabaseClient } from "@supabase/supabase-js";
import type { DesignerSession } from "@/lib/session";

/**
 * OTP/ERP users may not exist in `public.designers` until CSV import.
 * FK on designer_projects requires a row — upsert from session after login / before writes.
 */
export async function ensureDesignerRowInDb(
  supabase: SupabaseClient,
  session: Pick<DesignerSession, "designerCode" | "phone" | "fullName">
): Promise<{ ok: true } | { ok: false; message: string }> {
  const designer_code = session.designerCode?.trim();
  const phone = session.phone?.trim();
  if (!designer_code || !phone) {
    return { ok: false, message: "חסר קוד מעצב או טלפון בסשן" };
  }
  const { error } = await supabase.from("designers").upsert(
    {
      designer_code,
      phone,
      full_name: session.fullName?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "designer_code" }
  );
  if (error) {
    console.error("ensureDesignerRowInDb", error);
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
