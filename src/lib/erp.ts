/**
 * ERP webhook helpers. Call these from API routes only (server-side).
 * All URLs and secrets from env.
 */

const getEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export async function erpValidatePhone(phone: string): Promise<{
  found: boolean;
  designerCode?: string;
  fullName?: string;
  email?: string;
  commissionRate?: number;
  [key: string]: unknown;
}> {
  const url = getEnv("ERP_VALIDATE_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error(`ERP validate failed: ${res.status}`);
  return res.json();
}

export async function erpGetDeals(agentCode: string): Promise<unknown> {
  const url = getEnv("ERP_DEALS_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentCode }),
  });
  if (!res.ok) throw new Error(`ERP deals failed: ${res.status}`);
  return res.json();
}

export async function erpUpdateProfile(agentCode: string, data: Record<string, unknown>): Promise<void> {
  const url = getEnv("ERP_PROFILE_UPDATE_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentCode, ...data }),
  });
  if (!res.ok) throw new Error(`ERP profile update failed: ${res.status}`);
}

export async function erpSubmitReferral(payload: {
  agentCode: string;
  phone: string;
  optionalField?: string;
  optionalValue?: string;
}): Promise<void> {
  const url = getEnv("ERP_REFERRAL_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`ERP referral failed: ${res.status}`);
}

export async function erpContact(agentCode: string, message: string): Promise<void> {
  const url = getEnv("ERP_CONTACT_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentCode, message }),
  });
  if (!res.ok) throw new Error(`ERP contact failed: ${res.status}`);
}

export async function erpSubmitInvoice(agentCode: string, invoiceUrl: string, metadata?: Record<string, unknown>): Promise<void> {
  const url = getEnv("ERP_INVOICE_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentCode, invoiceUrl, ...metadata }),
  });
  if (!res.ok) throw new Error(`ERP invoice failed: ${res.status}`);
}

export async function whatsAppSendOtp(phone: string, code: string): Promise<void> {
  const url = getEnv("WHATSAPP_OTP_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) throw new Error(`WhatsApp OTP webhook failed: ${res.status}`);
}
