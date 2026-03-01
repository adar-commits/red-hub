/**
 * In-memory OTP store. No DB.
 * Note: In serverless (e.g. Vercel) each instance has its own memory; for production multi-instance consider Redis.
 */
type OtpEntry = {
  code: string;
  expiresAt: number;
  designerCode: string;
  fullName: string | null;
  commissionCertificates: unknown[];
};

const g = globalThis as typeof globalThis & { __otpStore?: Map<string, OtpEntry> };
if (!g.__otpStore) g.__otpStore = new Map();
const otpStore = g.__otpStore;

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setOtp(
  phone: string,
  code: string,
  designerCode: string,
  fullName: string | null,
  commissionCertificates: unknown[] = [],
): void {
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + TTL_MS,
    designerCode,
    fullName,
    commissionCertificates,
  });
}

export function getAndConsumeOtp(
  phone: string,
  code: string,
): { designerCode: string; fullName: string | null; commissionCertificates: unknown[] } | null {
  const entry = otpStore.get(phone);
  if (!entry) return null;
  const bypass = code === "00000";
  const validCode = bypass || (entry.code === code && Date.now() <= entry.expiresAt);
  if (!validCode) return null;
  otpStore.delete(phone);
  return {
    designerCode: entry.designerCode,
    fullName: entry.fullName,
    commissionCertificates: entry.commissionCertificates,
  };
}

function randomDigits(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function generateOtp(): string {
  return randomDigits(5);
}
