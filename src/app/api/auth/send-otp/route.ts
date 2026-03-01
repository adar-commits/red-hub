import { NextResponse } from "next/server";
import { erpSendOtpWithData, erpGetDeals } from "@/lib/erp";
import { generateOtp, setOtp } from "@/lib/otp-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const termsAccepted = body.termsAccepted === true;

    if (!phone) {
      return NextResponse.json({ error: "טלפון חסר" }, { status: 400 });
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: "יש לאשר את תקנון המסחר והשימוש" }, { status: 400 });
    }

    const normalized = phone.replace(/\D/g, "").replace(/^0/, "972") || phone;
    const isIsraeli = /^05\d{8}$/.test(phone) || /^9725\d{8}$/.test(normalized);
    if (!isIsraeli && phone.length < 9) {
      return NextResponse.json({ error: "יש להזין טלפון בפורמט 05xxxxxxxx" }, { status: 400 });
    }

    const code = generateOtp();

    // Send OTP via webhook; webhook also returns all commission certificate data for this agent
    const result = await erpSendOtpWithData(phone, code);

    if (!result || result.length === 0 || !result[0]?.agentcode) {
      return NextResponse.json(
        { error: "לא נמצא במערכת. יש ליצור קשר עם החברה להרשמה." },
        { status: 404 }
      );
    }

    const agentcode = result[0].agentcode;
    const commissionCertificates = result.flatMap((g) => g.commissionCertificates ?? []);

    // Fetch deals in parallel now that we have the agentCode
    let deals: unknown[] = [];
    try {
      deals = await erpGetDeals(agentcode);
    } catch (e) {
      console.warn("deals pre-fetch failed (non-fatal):", e);
    }

    setOtp(phone, code, agentcode, null, commissionCertificates, deals);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("send-otp", e);
    return NextResponse.json(
      { error: "שגיאה בשליחת הקוד. נסה שוב." },
      { status: 500 }
    );
  }
}
