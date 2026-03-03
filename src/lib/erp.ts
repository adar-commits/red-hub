/**
 * ERP webhook helpers. Call these from API routes only (server-side).
 * All URLs and secrets from env.
 */

/** Line item of a commission request (COMITEMS) per IVNUM */
export interface ErpComItem {
  ITEMCODE?: string | null;
  ITEMDES?: string | null;
  QTY?: number | null;
  PRICE?: number | null;
  TOTPRICE?: number | null;
  COMMISSION?: number | null;
  [key: string]: unknown;
}

/** Certificate record from ERP send-OTP webhook (new flat format) */
export interface ErpOtpCertRecord {
  CODE?: string | null;
  AGENT2FLAG?: string | null;
  DETAILS?: string | null;
  IVRECONDATE?: string | null;
  USERLOGIN?: string | null;
  UDATE?: string | null;
  Y_7449_5_ESHB?: string | null;
  Y_6137_0_ESHB?: string | null;
  Y_2572_0_ESHB?: string | null;
  KLINE?: number | null;
  IVNUM?: string | null;
  IVCODE?: string | null;
  IVDATE?: string | null;
  CUSTDES?: string | null;
  ORDNAME?: string | null;
  IVPRICE?: number | null;
  ICODE?: string | null;
  COMMISSION?: number | null;
  AGENTCODE?: string | null;
  /** Inner rows (commission request line items) for this IVNUM */
  COMITEMS?: ErpComItem[] | null;
  [key: string]: unknown;
}

/** Legacy send-OTP response item */
export interface ErpOtpLegacyItem {
  agentcode?: string;
  otp?: string;
  commissionCertificates?: unknown[];
  [key: string]: unknown;
}

/** Wrapper response: single object with agentcode + certificates */
export interface ErpOtpWrapperResponse {
  agentcode?: string;
  certificates?: ErpOtpCertRecord[];
  commissionCertificates?: ErpOtpCertRecord[];
  [key: string]: unknown;
}

export type ErpOtpRawResponse =
  | ErpOtpLegacyItem[]
  | ErpOtpCertRecord[]
  | ErpOtpWrapperResponse;

/** Normalized result for send-OTP: certs array + agentcode when available */
export interface ErpOtpNormalized {
  agentcode: string | null;
  certs: ErpOtpCertRecord[];
}

function isCertRecord(obj: unknown): obj is ErpOtpCertRecord {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "IVNUM" in obj
  );
}

function isLegacyItem(obj: unknown): obj is ErpOtpLegacyItem {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "commissionCertificates" in obj
  );
}

/**
 * Normalize ERP send-OTP webhook response into a single cert list and optional agentcode.
 * Supports: legacy [{ agentcode, commissionCertificates }], flat cert array [...], wrapper { agentcode, certificates }.
 */
export function normalizeErpOtpResponse(raw: unknown): ErpOtpNormalized {
  if (raw == null) return { agentcode: null, certs: [] };

  // Single wrapper object
  if (
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    ("certificates" in raw || "commissionCertificates" in raw)
  ) {
    const w = raw as ErpOtpWrapperResponse;
    const certs = (w.certificates ?? w.commissionCertificates ?? []) as ErpOtpCertRecord[];
    return {
      agentcode: typeof w.agentcode === "string" ? w.agentcode : null,
      certs: Array.isArray(certs) ? certs : [],
    };
  }

  if (!Array.isArray(raw) || raw.length === 0) return { agentcode: null, certs: [] };

  const first = raw[0];

  // Single-item array wrapper: [{ agentcode, certificates }]
  if (
    typeof first === "object" &&
    first !== null &&
    ("certificates" in first || "commissionCertificates" in first)
  ) {
    const w = first as ErpOtpWrapperResponse;
    const certs = (w.certificates ?? w.commissionCertificates ?? []) as ErpOtpCertRecord[];
    return {
      agentcode: typeof w.agentcode === "string" ? w.agentcode : null,
      certs: Array.isArray(certs) ? certs : [],
    };
  }

  // Legacy: [{ agentcode, commissionCertificates }, ...]
  if (isLegacyItem(first)) {
    const agentcode = typeof first.agentcode === "string" ? first.agentcode : null;
    const certs = raw.flatMap((g: ErpOtpLegacyItem) =>
      Array.isArray(g.commissionCertificates) ? (g.commissionCertificates as ErpOtpCertRecord[]) : []
    );
    return { agentcode, certs };
  }

  // New flat cert array: [{ IVNUM, IVCODE, ... }, ...]
  if (isCertRecord(first)) {
    const certs = raw as ErpOtpCertRecord[];
    const agentcode =
      typeof first.AGENTCODE === "string" ? first.AGENTCODE : null;
    return { agentcode, certs };
  }

  return { agentcode: null, certs: [] };
}

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

export async function erpGetDeals(agentCode: string): Promise<unknown[]> {
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

export async function erpSendOtpWithData(phone: string, otp: string): Promise<ErpOtpRawResponse> {
  const url = getEnv("ERP_SEND_OTP_WEBHOOK");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) throw new Error(`ERP send-otp webhook failed: ${res.status}`);
  return res.json() as Promise<ErpOtpRawResponse>;
}

const BUSINESS_GET_URL = "https://hook.eu2.make.com/fpc4q5vtdbzo5pra3kcotyy2i6tt7w2g";
const BUSINESS_UPDATE_URL = "https://hook.eu2.make.com/9yya0867dfwx3ivbx1au5wcqvmwl0pt5";

export interface BusinessInfo {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  companyType?: string;
  vatNo?: string;
  companyAddress?: string;
  companyCity?: string;
  designerType?: string;
  speciality?: string;
  birthday?: string;
  bankType?: string;
  bankBranch?: string;
  bankNo?: string;
  [key: string]: unknown;
}

export async function erpGetBusinessInfo(agentCode: string): Promise<BusinessInfo> {
  const url = process.env.ERP_BUSINESS_GET_WEBHOOK ?? BUSINESS_GET_URL;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentCode }),
  });
  if (!res.ok) throw new Error(`Business get webhook failed: ${res.status}`);
  return res.json() as Promise<BusinessInfo>;
}

export async function erpUpdateBusinessInfo(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.ERP_BUSINESS_UPDATE_WEBHOOK ?? BUSINESS_UPDATE_URL;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Business update webhook failed: ${res.status}`);
}
