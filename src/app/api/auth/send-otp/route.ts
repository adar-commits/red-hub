import { NextResponse } from "next/server";
import {
  erpSendOtpWithData,
  erpValidatePhone,
  normalizeErpOtpResponse,
  type ErpOtpCertRecord,
} from "@/lib/erp";
import { generateOtp } from "@/lib/otp-store";
import { normalizeIsraeliPhone } from "@/lib/phone";
import { getOtpSession } from "@/lib/session";
import { saveCommissions } from "@/lib/agent-store";

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
    comitems: Array.isArray(c.COMITEMS) ? c.COMITEMS : (Array.isArray(c.COMITEMS_SUBFORM) ? c.COMITEMS_SUBFORM : []),
  };
}

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

    const { agentcode: parsedAgentcode, agentname, certs } = normalizeErpOtpResponse(raw);

    let agentcode: string | null = parsedAgentcode;
    let fullName: string | null = agentname;
    if (!agentcode) {
      try {
        const validated = await erpValidatePhone(rawPhone);
        let fromValidate: string | null = null;
        if (validated && validated.found !== false) {
          const r = validated as Record<string, unknown>;
          for (const k of ["designerCode", "agentCode", "AGENTCODE"]) {
            const x = r[k];
            if (typeof x === "string" && x.trim()) {
              fromValidate = x.trim();
              break;
            }
          }
        }
        agentcode = fromValidate ?? agentcode;
        if (!fullName && typeof validated?.fullName === "string") fullName = validated.fullName;
      } catch {
        agentcode = parsedAgentcode;
      }
    }

    // ERP may return only [{ success: true }] with no agent code — still allow OTP login using phone as stable id.
    if (!agentcode) {
      agentcode = phone;
    }

    const commissions = certs.map(mapCertToCommission);

    try {
      await saveCommissions(agentcode, commissions);
    } catch (e) {
      console.error("saveCommissions after send-otp:", e);
    }

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
