import { redirect } from "next/navigation";
import { ensureDesignerRowInDb } from "@/lib/ensure-designer-in-db";
import { isDesignerCodePhoneFallback, resolveAgentCodeViaErpValidate } from "@/lib/erp-agent-code";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { DesignerShell } from "@/components/designer/DesignerShell";

export default async function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDesignerSession();
  if (!session?.designerCode || isSessionExpired(session)) {
    redirect("/");
  }

  if (isDesignerCodePhoneFallback(session.designerCode, session.phone)) {
    const { code, fullName } = await resolveAgentCodeViaErpValidate(session.phone, session.phone);
    if (code && !isDesignerCodePhoneFallback(code, session.phone) && code !== session.designerCode) {
      session.designerCode = code;
      if (fullName && !session.fullName?.trim()) session.fullName = fullName;
      await session.save();
      try {
        const supabase = createServerSupabaseClient();
        await ensureDesignerRowInDb(supabase, {
          designerCode: code,
          phone: session.phone,
          fullName: session.fullName,
        });
      } catch (e) {
        console.error("designer layout agent code repair", e);
      }
    }
  }

  return (
    <DesignerShell
      designerCode={session.designerCode}
      fullName={session.fullName}
    >
      {children}
    </DesignerShell>
  );
}
