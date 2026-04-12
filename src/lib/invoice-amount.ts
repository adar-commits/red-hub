/**
 * ERP TOTPRICE for designer invoices is inclusive of Israeli VAT.
 * Expose net (excl. VAT) for display as "סכום ללא מע״מ".
 * Override rate with ILS_VAT_RATE env (e.g. 0.17 for 17%).
 */
const DEFAULT_ILS_VAT_RATE = 0.18;

function ilsVatRateFromEnv(): number {
  const raw = process.env.ILS_VAT_RATE;
  if (raw == null || raw === "") return DEFAULT_ILS_VAT_RATE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1) return DEFAULT_ILS_VAT_RATE;
  return n;
}

export function grossIlsToAmountExclVat(gross: number | null | undefined): number | undefined {
  if (gross == null || !Number.isFinite(Number(gross))) return undefined;
  const g = Number(gross);
  const rate = ilsVatRateFromEnv();
  if (rate <= 0) return g;
  return g / (1 + rate);
}
