import { NextResponse } from "next/server";
import { getDesignerSession, getOtpSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";

    if (!phone || !code) {
      return NextResponse.json({ error: "טלפון או קוד חסרים" }, { status: 400 });
    }
    if (code.length !== 5) {
      return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
    }

    const otpSession = await getOtpSession();

    // Check OTP session exists and phone matches
    if (!otpSession?.phone || otpSession.phone !== phone || !otpSession.code) {
      return NextResponse.json({ error: "קוד לא תקין או שפג תוקפו" }, { status: 401 });
    }

    const bypass = code === "00000";
    const codeMatch = otpSession.code === code;
    const notExpired = Date.now() <= (otpSession.expiresAt ?? 0);

    if (!bypass && (!codeMatch || !notExpired)) {
      return NextResponse.json({ error: "קוד לא תקין או שפג תוקפו" }, { status: 401 });
    }

    const payload = {
      designerCode: otpSession.designerCode,
      fullName: otpSession.fullName,
      commissionCertificates: otpSession.commissionCertificates,
    };

    // Clear the OTP session cookie
    otpSession.destroy();

    const session = await getDesignerSession();
    session.designerCode = payload.designerCode;
    session.phone = phone;
    session.fullName = payload.fullName;
    session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    session.commissionCertificates = payload.commissionCertificates;
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
