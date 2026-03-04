import { NextResponse } from "next/server";
import {
  erpSendOtpWithData,
  erpValidatePhone,
  normalizeErpOtpResponse,
  type ErpOtpCertRecord,
} from "@/lib/erp";
import { generateOtp } from "@/lib/otp-store";
import { getOtpSession } from "@/lib/session";

function mapCertToCommission(c: ErpOtpCertRecord) {
  return {
    id: c.IVNUM ?? undefined,
    comnum: c.COMNUM ?? c.IVNUM ?? undefined,
    date: c.CURDATE ?? c.IVDATE ?? undefined,
    updated_at: c.UDATE ?? undefined,
    customer: c.CUSTDES ?? undefined,
    amount: c.IVPRICE ?? undefined,
    commission: c.COMMISSION ?? undefined,
    invoice_code: c.IVCODE ?? undefined,
    recon_date: c.IVRECONDATE ?? undefined,
    status: (c.STATDES ?? c.STATUS ?? c.DETAILS) as string | undefined,
    comitems: Array.isArray(c.COMITEMS) ? c.COMITEMS : [],
  };
}

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

    const raw = await erpSendOtpWithData(phone, code);
    const { agentcode: parsedAgentcode, agentname, certs } = normalizeErpOtpResponse(raw);

    let agentcode: string | null = parsedAgentcode;
    let fullName: string | null = agentname;
    if (!agentcode && certs.length > 0) {
      try {
        const validated = await erpValidatePhone(phone);
        agentcode =
          typeof validated?.designerCode === "string" ? validated.designerCode : null;
        if (!fullName && typeof validated?.fullName === "string") fullName = validated.fullName;
      } catch {
        agentcode = null;
      }
    }

    if (!agentcode) {
      return NextResponse.json(
        { error: "לא נמצא במערכת. יש ליצור קשר עם החברה להרשמה." },
        { status: 404 }
      );
    }

    const commissions = certs.map(mapCertToCommission);

    const otpSession = await getOtpSession();
    otpSession.phone = phone;
    otpSession.code = code;
    otpSession.designerCode = agentcode;
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
