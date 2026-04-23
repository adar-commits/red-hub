import { saveCommissions } from "@/lib/agent-store";
import { normalizeErpOtpResponse, type ErpOtpCertRecord } from "@/lib/erp";
import { isDesignerCodePhoneFallback, resolveAgentCodeViaErpValidate } from "@/lib/erp-agent-code";

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

  let agentcode: string | null = parsedAgentcode?.trim() || null;
  let fullName: string | null = agentname;

  if (!agentcode || isDesignerCodePhoneFallback(agentcode, phone)) {
    const { code, fullName: fn } = await resolveAgentCodeViaErpValidate(rawPhone, phone);
    if (code) {
      if (!isDesignerCodePhoneFallback(code, phone)) {
        agentcode = code;
        if (fn) fullName = fullName || fn;
      } else if (!agentcode) {
        agentcode = code;
        if (fn) fullName = fullName || fn;
      }
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
