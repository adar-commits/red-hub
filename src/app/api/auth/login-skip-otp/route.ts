import { NextResponse } from "next/server";
import { recordDesignerActivity } from "@/lib/designer-activity";
import { erpValidatePhone } from "@/lib/erp";
import { ensureDesignerRowInDb } from "@/lib/ensure-designer-in-db";
import { normalizeIsraeliPhone } from "@/lib/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDesignerSession } from "@/lib/session";

/**
 * Phone + terms only — no OTP. Used when the client was opened with ?Skip=1 (client must send skip: 1).
 * Does not call the ERP send-OTP webhook.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const termsAccepted = body.termsAccepted === true;
    const skip = body.skip === 1 || body.skip === "1";

    if (!skip) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 403 });
    }

    if (!rawPhone) {
      return NextResponse.json({ error: "טלפון חסר" }, { status: 400 });
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: "יש לאשר את תקנון המסחר והשימוש" }, { status: 400 });
    }

    const phone = normalizeIsraeliPhone(rawPhone);
    if (!phone) {
      return NextResponse.json({ error: "יש להזין טלפון בפורמט 05xxxxxxxx" }, { status: 400 });
    }

    const digits = rawPhone.replace(/\D/g, "");
    const isIsraeli =
      /^05\d{8}$/.test(digits) ||
      /^5\d{8}$/.test(digits) ||
      /^9725\d{8}$/.test(digits);
    if (!isIsraeli && digits.replace(/^972/, "").length < 9) {
      return NextResponse.json({ error: "יש להזין טלפון בפורמט 05xxxxxxxx" }, { status: 400 });
    }

    let designerCode: string | null = null;
    let fullName: string | null = null;
    try {
      const validated = await erpValidatePhone(rawPhone);
      if (validated && validated.found !== false) {
        const r = validated as Record<string, unknown>;
        for (const k of ["designerCode", "agentCode", "AGENTCODE"]) {
          const x = r[k];
          if (typeof x === "string" && x.trim()) {
            designerCode = x.trim();
            break;
          }
        }
        if (typeof validated.fullName === "string") fullName = validated.fullName;
      }
    } catch (e) {
      console.error("login-skip-otp erpValidatePhone:", e);
    }

    if (!designerCode) {
      designerCode = phone;
    }

    console.log("[login-skip-otp] direct session", { phone, designerCode });

    const session = await getDesignerSession();
    session.designerCode = designerCode;
    session.phone = phone;
    session.fullName = fullName;
    session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await session.save();

    try {
      const supabase = createServerSupabaseClient();
      const ensured = await ensureDesignerRowInDb(supabase, {
        designerCode,
        phone,
        fullName,
      });
      if (!ensured.ok) console.error("login-skip-otp ensureDesignerRowInDb:", ensured.message);
    } catch (e) {
      console.error("login-skip-otp ensureDesignerRowInDb", e);
    }

    void recordDesignerActivity({
      activity_type: "login",
      designer_code: designerCode,
      agent_name: fullName,
      phone,
      metadata: { skipOtpUrl: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("login-skip-otp", e);
    return NextResponse.json({ error: "שגיאה בהתחברות" }, { status: 500 });
  }
}
