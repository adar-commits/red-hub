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
  IVPRICE?: number | null;
  COMMISSION?: number | null;
  CDES?: string | null;
  CUSTDES?: string | null;
  IVDATE?: string | null;
  CURDATE?: string | null;
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
  COMNUM?: string | null;
  CURDATE?: string | null;
  IVDATE?: string | null;
  CUSTDES?: string | null;
  ORDNAME?: string | null;
  IVPRICE?: number | null;
  ICODE?: string | null;
  COMMISSION?: number | null;
  AGENTCODE?: string | null;
  STATDES?: string | null;
  STATUS?: string | null;
  /** Inner rows (commission request line items) for this IVNUM */
  COMITEMS?: ErpComItem[] | null;
  /** Alternative key for same data (ERP subform name) */
  COMITEMS_SUBFORM?: ErpComItem[] | null;
  [key: string]: unknown;
}

/** Legacy send-OTP response item */
export interface ErpOtpLegacyItem {
  agentcode?: string;
  agentname?: string;
  otp?: string;
  commissionCertificates?: unknown[];
  [key: string]: unknown;
}

/** Wrapper response: single object with agentcode + agentname + certificates */
export interface ErpOtpWrapperResponse {
  agentcode?: string;
  agentname?: string;
  certificates?: ErpOtpCertRecord[];
  commissionCertificates?: ErpOtpCertRecord[];
  [key: string]: unknown;
}

export type ErpOtpRawResponse =
  | ErpOtpLegacyItem[]
  | ErpOtpCertRecord[]
  | ErpOtpWrapperResponse;

/** Normalized result for send-OTP: certs array + agentcode + agentname when available */
export interface ErpOtpNormalized {
  agentcode: string | null;
  agentname: string | null;
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
function pickAgentname(w: { agentname?: string; [key: string]: unknown }): string | null {
  return typeof w.agentname === "string" && w.agentname.trim() ? w.agentname.trim() : null;
}

function isErpAgentNotFoundToken(v: string): boolean {
  return v.trim().toLowerCase() === "not found";
}

function pickAgentcode(w: Record<string, unknown>): string | null {
  for (const key of ["agentcode", "agentCode", "AGENTCODE"] as const) {
    const v = w[key];
    if (typeof v === "string") {
      const t = v.trim();
      if (t && !isErpAgentNotFoundToken(t)) return t;
    }
  }
  return null;
}

/** Send-OTP webhook returns e.g. [{ "agentcode": "not found" }] when the phone is not registered in ERP. */
export function isErpSendOtpAgentNotFoundResponse(raw: unknown): boolean {
  const row =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null
        ? (raw[0] as Record<string, unknown>)
        : null;
  if (!row) return false;
  for (const key of ["agentcode", "agentCode", "AGENTCODE"] as const) {
    const v = row[key];
    if (typeof v === "string" && isErpAgentNotFoundToken(v)) return true;
  }
  return false;
}

export function normalizeErpOtpResponse(raw: unknown): ErpOtpNormalized {
  if (raw == null) return { agentcode: null, agentname: null, certs: [] };

  // Single wrapper / success object (may omit certificate arrays — still valid login)
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const w = raw as ErpOtpWrapperResponse & Record<string, unknown>;
    const hasCertLists = "certificates" in w || "commissionCertificates" in w;
    const agentcode = pickAgentcode(w);

    if (hasCertLists) {
      const certs = (w.certificates ?? w.commissionCertificates ?? []) as ErpOtpCertRecord[];
      return {
        agentcode,
        agentname: pickAgentname(w),
        certs: Array.isArray(certs) ? certs : [],
      };
    }

    if (agentcode) {
      return {
        agentcode,
        agentname: pickAgentname(w),
        certs: [],
      };
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) return { agentcode: null, agentname: null, certs: [] };

  const first = raw[0];

  // Single-item array wrapper: [{ agentcode, certificates }]
  if (
    typeof first === "object" &&
    first !== null &&
    ("certificates" in first || "commissionCertificates" in first)
  ) {
    const w = first as ErpOtpWrapperResponse & Record<string, unknown>;
    const certs = (w.certificates ?? w.commissionCertificates ?? []) as ErpOtpCertRecord[];
    return {
      agentcode: pickAgentcode(w),
      agentname: pickAgentname(w),
      certs: Array.isArray(certs) ? certs : [],
    };
  }

  // Legacy: [{ agentcode, commissionCertificates }, ...]
  if (isLegacyItem(first)) {
    const agentcode = pickAgentcode(first as Record<string, unknown>);
    const agentname = pickAgentname(first);
    const certs = raw.flatMap((g: ErpOtpLegacyItem) =>
      Array.isArray(g.commissionCertificates) ? (g.commissionCertificates as ErpOtpCertRecord[]) : []
    );
    return { agentcode, agentname, certs };
  }

  // New flat cert array: [{ IVNUM, IVCODE, ... }, ...]
  if (isCertRecord(first)) {
    const certs = raw as ErpOtpCertRecord[];
    const agentcode =
      typeof first.AGENTCODE === "string" ? first.AGENTCODE : null;
    const agentname = typeof (first as ErpOtpCertRecord & { agentname?: string }).agentname === "string"
      ? (first as ErpOtpCertRecord & { agentname?: string }).agentname
      : null;
    return { agentcode, agentname: agentname?.trim() ?? null, certs };
  }

  // ACK-only row from send-OTP webhook e.g. [{ success: true }] or [{ success: true, agentcode: "…" }]
  if (typeof first === "object" && first !== null && "success" in first) {
    const w = first as Record<string, unknown>;
    return {
      agentcode: pickAgentcode(w),
      agentname: pickAgentname(w),
      certs: [],
    };
  }

  return { agentcode: null, agentname: null, certs: [] };
}

const getEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

/** ERP webhooks expect `agentCode`, never a `designerCode` JSON key. */
function withoutDesignerCodeKey(data: Record<string, unknown>): Record<string, unknown> {
  const { designerCode: _omit, ...rest } = data;
  return rest;
}

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
    body: JSON.stringify({ agentCode, ...withoutDesignerCodeKey(data) }),
  });
  if (!res.ok) throw new Error(`ERP profile update failed: ${res.status}`);
}

const REFERRAL_WEBHOOK_URL = "https://hook.eu2.make.com/9yya0867dfwx3ivbx1au5wcqvmwl0pt5";

type ReferralWebhookBody = {
  status?: number;
  response?: string;
  respond?: string;
  error?: string;
  [key: string]: unknown;
};

function pickReferralWebhookUserMessage(parsed: ReferralWebhookBody | null): string | undefined {
  if (!parsed || typeof parsed !== "object") return undefined;
  for (const key of ["response", "respond", "error"] as const) {
    const v = parsed[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Make.com may return HTTP 200 with JSON { status, response }; only 200/201 are success. */
export async function erpSubmitReferral(payload: {
  validationPhone: string;
  validationComSum: string;
  validationfieldType: string;
  validationfieldValue: string;
  eventType: "commisionRequest";
  agentCode: string;
  assignmentType: "invoice";
}): Promise<ReferralWebhookBody | null> {
  const url = process.env.ERP_REFERRAL_WEBHOOK ?? REFERRAL_WEBHOOK_URL;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed: ReferralWebhookBody | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ReferralWebhookBody;
    } catch {
      parsed = { response: text };
    }
  }

  const biz = parsed?.status;
  const hasBizStatus = typeof biz === "number" && Number.isFinite(biz);
  const bizOk = !hasBizStatus || biz === 200 || biz === 201;

  if (!res.ok || !bizOk) {
    const message =
      pickReferralWebhookUserMessage(parsed) || `ERP referral failed: ${res.status}`;
    throw new Error(message);
  }

  return parsed;
}

const DEFAULT_CONTACT_WEBHOOK_URL =
  "https://hook.eu2.make.com/9yya0867dfwx3ivbx1au5wcqvmwl0pt5";

/** Make.com / ERP contact: actionType contact + agentCode + subject + body */
export async function erpContact(
  agentCode: string,
  message: string,
  subject?: string | null
): Promise<void> {
  const url = process.env.ERP_CONTACT_WEBHOOK ?? DEFAULT_CONTACT_WEBHOOK_URL;
  const sub = typeof subject === "string" ? subject.trim() : "";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actionType: "contact",
      agentCode,
      subject: sub,
      body: message,
    }),
  });
  if (!res.ok) throw new Error(`ERP contact failed: ${res.status}`);
}

export async function erpSubmitInvoice(agentCode: string, invoiceUrl: string, metadata?: Record<string, unknown>): Promise<void> {
  const url = getEnv("ERP_INVOICE_WEBHOOK");
  const extra = metadata ? withoutDesignerCodeKey(metadata) : {};
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentCode, invoiceUrl, ...extra }),
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
  experienceYears?: string;
  howDidYouHear?: string;
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
    body: JSON.stringify(withoutDesignerCodeKey(payload)),
  });
  if (!res.ok) throw new Error(`Business update webhook failed: ${res.status}`);
}
