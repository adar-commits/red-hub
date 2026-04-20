import { NextResponse } from "next/server";
import { recordDesignerActivity } from "@/lib/designer-activity";
import { erpSendOtpWithData } from "@/lib/erp";
import { ensureDesignerRowInDb } from "@/lib/ensure-designer-in-db";
import { normalizeIsraeliPhone } from "@/lib/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDesignerSession } from "@/lib/session";
import { integrateSendOtpWebhookResponse } from "@/lib/send-otp-webhook-result";

/** Same value as URL `?password=…` and OTP bypass in `verify-otp`. */
const LOGIN_SKIP_OTP_PASSWORD = "1365";

/**
 * Phone + terms only — no OTP. Used when the client was opened with `?password=1365` (body must send matching password).
 * Waits for ERP send-OTP webhook (`master: true`) and uses the same response handling as normal send-otp for dashboard data.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const termsAccepted = body.termsAccepted === true;
    const password = typeof body.password === "string" ? body.password : "";

    if (password !== LOGIN_SKIP_OTP_PASSWORD) {
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

    const raw = await erpSendOtpWithData(rawPhone, "", { master: true });
    console.log("[login-skip-otp] ERP webhook response (master)", { phone, raw });

    const { designerCode, fullName, commissions } = await integrateSendOtpWebhookResponse(
      raw,
      rawPhone,
      phone
    );

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

    return NextResponse.json({ success: true, commissions });
  } catch (e) {
    console.error("login-skip-otp", e);
    const isDev = process.env.NODE_ENV === "development";
    const message = isDev ? String(e) : "שגיאה בהתחברות. נסה שוב.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
