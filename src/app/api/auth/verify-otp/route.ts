import { NextResponse } from "next/server";
import { getAndConsumeOtp } from "@/lib/otp-store";
import { getDesignerSession } from "@/lib/session";
import { erpGetDeals } from "@/lib/erp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";

    if (!phone || !code) {
      return NextResponse.json({ error: "טלפון או קוד חסרים" }, { status: 400 });
    }
    if (code.length !== 6) {
      return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
    }

    const payload = getAndConsumeOtp(phone, code);
    if (!payload) {
      return NextResponse.json({ error: "קוד לא תקין או שפג תוקפו" }, { status: 401 });
    }

    // Fetch deals now that OTP is verified (non-fatal if it fails)
    let deals: unknown[] = [];
    try {
      deals = await erpGetDeals(payload.designerCode);
    } catch (e) {
      console.warn("deals fetch failed (non-fatal):", e);
    }

    const session = await getDesignerSession();
    session.designerCode = payload.designerCode;
    session.phone = phone;
    session.fullName = payload.fullName;
    session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    session.commissionCertificates = payload.commissionCertificates;
    session.deals = deals;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("verify-otp", e);
    return NextResponse.json(
      { error: "שגיאה באימות" },
      { status: 500 }
    );
  }
}
