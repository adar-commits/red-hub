import { saveCommissions } from "@/lib/agent-store";
import {
  erpValidatePhone,
  normalizeErpOtpResponse,
  type ErpOtpCertRecord,
} from "@/lib/erp";

export function mapCertToCommission(c: ErpOtpCertRecord) {
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

/**
 * Parses ERP send-OTP webhook JSON, resolves designer id, persists commissions for dashboard APIs / session cache.
 */
export async function integrateSendOtpWebhookResponse(
  raw: unknown,
  rawPhone: string,
  phone: string
): Promise<{
  designerCode: string;
  fullName: string | null;
  commissions: ReturnType<typeof mapCertToCommission>[];
}> {
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

  if (!agentcode) {
    agentcode = phone;
  }

  const commissions = certs.map(mapCertToCommission);

  try {
    await saveCommissions(agentcode, commissions);
  } catch (e) {
    console.error("saveCommissions after ERP send-otp webhook:", e);
  }

  return { designerCode: agentcode, fullName, commissions };
}
