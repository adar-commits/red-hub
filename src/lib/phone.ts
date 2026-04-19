/**
 * Canonical mobile key for OTP/session matching (digits only, Israeli → 972…).
 */
export function normalizeIsraeliPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("972")) return d;
  if (d.startsWith("0") && d.length >= 9) return `972${d.slice(1)}`;
  if (d.length === 9 && d.startsWith("5")) return `972${d}`;
  return d;
}
