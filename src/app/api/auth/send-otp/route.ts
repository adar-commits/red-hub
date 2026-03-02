import { NextResponse } from "next/server";
import { erpSendOtpWithData } from "@/lib/erp";
import { generateOtp } from "@/lib/otp-store";
import { getOtpSession } from "@/lib/session";

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

    const result = await erpSendOtpWithData(phone, code);

    if (!result || result.length === 0 || !result[0]?.agentcode) {
      return NextResponse.json(
        { error: "לא נמצא במערכת. יש ליצור קשר עם החברה להרשמה." },
        { status: 404 }
      );
    }

    const agentcode = result[0].agentcode;
    const commissionCertificates = result.flatMap((g) => g.commissionCertificates ?? []);

    // Save OTP state into an encrypted cookie instead of in-memory store
    const otpSession = await getOtpSession();
    otpSession.phone = phone;
    otpSession.code = code;
    otpSession.designerCode = agentcode;
    otpSession.fullName = null;
    otpSession.commissionCertificates = commissionCertificates;
    otpSession.expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await otpSession.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("send-otp error:", e);
    const isDev = process.env.NODE_ENV === "development";
    const message = isDev ? String(e) : "שגיאה בשליחת הקוד. נסה שוב.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
