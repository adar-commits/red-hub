import { NextResponse } from "next/server";
import { erpSendOtpWithData } from "@/lib/erp";
import { generateOtp } from "@/lib/otp-store";
import { normalizeIsraeliPhone } from "@/lib/phone";
import { getOtpSession } from "@/lib/session";
import { integrateSendOtpWebhookResponse } from "@/lib/send-otp-webhook-result";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const termsAccepted = body.termsAccepted === true;

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

    const code = generateOtp();

    const raw = await erpSendOtpWithData(rawPhone, code, { master: false });
    console.log("[send-otp] ERP webhook response (unconditional)", { phone, raw });

    const { designerCode, fullName, commissions } = await integrateSendOtpWebhookResponse(
      raw,
      rawPhone,
      phone
    );

    const otpSession = await getOtpSession();
    otpSession.phone = phone;
    otpSession.code = code;
    otpSession.designerCode = designerCode;
    otpSession.fullName = fullName;
    otpSession.expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await otpSession.save();

    return NextResponse.json({ success: true, commissions });
  } catch (e) {
    console.error("send-otp error:", e);
    const isDev = process.env.NODE_ENV === "development";
    const message = isDev ? String(e) : "שגיאה בשליחת הקוד. נסה שוב.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
