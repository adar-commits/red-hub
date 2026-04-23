import { erpValidatePhone } from "@/lib/erp";

const VALIDATE_CODE_KEYS = ["designerCode", "agentCode", "AGENTCODE", "agentcode"] as const;

/** Extract agent / designer code from an ERP phone-validation JSON payload. */
export function pickAgentCodeFromValidateResponse(validated: unknown): string | null {
  if (!validated || typeof validated !== "object") return null;
  const r = validated as Record<string, unknown>;
  for (const k of VALIDATE_CODE_KEYS) {
    const x = r[k];
    if (typeof x === "string" && x.trim()) return x.trim();
  }
  return null;
}

export function pickFullNameFromValidateResponse(validated: unknown): string | null {
  if (!validated || typeof validated !== "object") return null;
  const r = validated as Record<string, unknown>;
  if (typeof r.fullName === "string" && r.fullName.trim()) return r.fullName.trim();
  return null;
}

/** Distinct phone strings to try with ERP validate (Make may only accept 05… or 972…). */
export function phoneVariantsForErpValidate(rawOrNormalized: string, normalizedPhone: string): string[] {
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t) seen.add(t);
  };
  add(rawOrNormalized);
  add(normalizedPhone);
  const d = normalizedPhone.replace(/\D/g, "");
  if (d.startsWith("972") && d.length >= 10) {
    add(`0${d.slice(3)}`);
  }
  return Array.from(seen);
}

/**
 * `designerCode` was set to the normalized phone because ERP returned no code — re-resolve if possible.
 * Compares digits so minor formatting differences still match.
 */
export function isDesignerCodePhoneFallback(designerCode: string, sessionPhone: string): boolean {
  const a = designerCode.replace(/\D/g, "");
  const b = sessionPhone.replace(/\D/g, "");
  return a.length > 0 && a === b;
}

/**
 * Tries `erpValidatePhone` on each phone variant. Prefers a code that is not the same digits as the
 * login phone (so we don't stop at a response that echoes the number as "agent" before trying another format).
 */
export async function resolveAgentCodeViaErpValidate(
  rawPhone: string,
  normalizedPhone: string
): Promise<{ code: string | null; fullName: string | null }> {
  const variants = phoneVariantsForErpValidate(rawPhone, normalizedPhone);
  let phoneLike: { code: string; fullName: string | null } | null = null;
  for (const p of variants) {
    try {
      const validated = await erpValidatePhone(p);
      if (!validated || validated.found === false) continue;
      const code = pickAgentCodeFromValidateResponse(validated);
      if (!code) continue;
      const fn = pickFullNameFromValidateResponse(validated);
      if (!isDesignerCodePhoneFallback(code, normalizedPhone)) {
        return { code, fullName: fn };
      }
      if (!phoneLike) phoneLike = { code, fullName: fn };
    } catch (e) {
      console.error("resolveAgentCodeViaErpValidate", e);
    }
  }
  if (phoneLike) return phoneLike;
  return { code: null, fullName: null };
}
