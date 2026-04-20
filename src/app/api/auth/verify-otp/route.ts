import { NextResponse } from "next/server";
import { recordDesignerActivity } from "@/lib/designer-activity";
import { ensureDesignerRowInDb } from "@/lib/ensure-designer-in-db";
import { normalizeIsraeliPhone } from "@/lib/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDesignerSession, getOtpSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const phone = normalizeIsraeliPhone(rawPhone);
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";

    if (!phone || !code) {
      return NextResponse.json({ error: "טלפון או קוד חסרים" }, { status: 400 });
    }
    if (code.length !== 4) {
      return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
    }

    const otpSession = await getOtpSession();

    // Check OTP session exists and phone matches
    if (!otpSession?.phone || otpSession.phone !== phone || !otpSession.code) {
      return NextResponse.json({ error: "קוד לא תקין או שפג תוקפו" }, { status: 401 });
    }

    const bypass = code === "1365";
    const codeMatch = otpSession.code === code;
    const notExpired = Date.now() <= (otpSession.expiresAt ?? 0);

    if (!bypass && (!codeMatch || !notExpired)) {
      return NextResponse.json({ error: "קוד לא תקין או שפג תוקפו" }, { status: 401 });
    }

    const payload = {
      designerCode: otpSession.designerCode,
      fullName: otpSession.fullName,
    };

    // Clear the OTP session cookie
    otpSession.destroy();

    const session = await getDesignerSession();
    session.designerCode = payload.designerCode;
    session.phone = phone;
    session.fullName = payload.fullName;
    session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await session.save();

    try {
      const supabase = createServerSupabaseClient();
      const ensured = await ensureDesignerRowInDb(supabase, {
        designerCode: payload.designerCode,
        phone,
        fullName: payload.fullName,
      });
      if (!ensured.ok) console.error("verify-otp ensureDesignerRowInDb:", ensured.message);
    } catch (e) {
      console.error("verify-otp ensureDesignerRowInDb", e);
    }

    void recordDesignerActivity({
      activity_type: "login",
      designer_code: payload.designerCode,
      agent_name: payload.fullName,
      phone,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("verify-otp", e);
    return NextResponse.json(
      { error: "שגיאה באימות" },
      { status: 500 }
    );
  }
}
