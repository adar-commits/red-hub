import type { Json } from "@/types/database";

const MAX_MODELS = 40;
const MAX_MODEL_LEN = 120;
const MAX_NAME = 400;
const MAX_ADDR = 500;
const MAX_PHONE = 40;

export const ERR_INVALID_BODY = "\u05D1\u05E7\u05E9\u05D4 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4";
const ERR_INVALID = ERR_INVALID_BODY;
const ERR_NAME_REQUIRED = "\u05D7\u05D5\u05D1\u05D4 \u05DC\u05DE\u05DC\u05D0 \u05E9\u05DD \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8";
const ERR_NAME_LONG = "\u05E9\u05DD \u05D4\u05E4\u05E8\u05D5\u05D9\u05E7\u05D8 \u05D0\u05E8\u05D5\u05DA \u05DE\u05D3\u05D9";
const ERR_ADDR_LONG = "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05E8\u05D5\u05DB\u05D4 \u05DE\u05D3\u05D9";
const ERR_PHOTO_NAME_LONG = "\u05E9\u05DD \u05D4\u05E6\u05DC\u05DD \u05D0\u05E8\u05D5\u05DA \u05DE\u05D3\u05D9";
const ERR_PHOTO_PHONE_LONG = "\u05D8\u05DC\u05E4\u05D5\u05DF \u05D4\u05E6\u05DC\u05DD \u05D0\u05E8\u05D5\u05DA \u05DE\u05D3\u05D9";
const ERR_MODELS = "\u05D3\u05D2\u05DE\u05D9 \u05E9\u05D8\u05D9\u05D7\u05D9\u05DD \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D9\u05DD";

export interface NormalizedProjectPayload {
  project_name: string;
  address: string | null;
  photographer_name: string | null;
  photographer_phone: string | null;
  carpet_models: string[];
}

export function parseCarpetModels(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const t = item.trim();
    if (!t) continue;
    if (t.length > MAX_MODEL_LEN) return null;
    out.push(t);
    if (out.length > MAX_MODELS) return null;
  }
  return out;
}

export function normalizeProjectBody(body: unknown): { ok: true; data: NormalizedProjectPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: ERR_INVALID };
  const o = body as Record<string, unknown>;
  const project_name = typeof o.project_name === "string" ? o.project_name.trim() : "";
  if (!project_name) return { ok: false, error: ERR_NAME_REQUIRED };
  if (project_name.length > MAX_NAME) return { ok: false, error: ERR_NAME_LONG };

  const address = typeof o.address === "string" ? o.address.trim() || null : null;
  if (address && address.length > MAX_ADDR) return { ok: false, error: ERR_ADDR_LONG };

  const photographer_name =
    typeof o.photographer_name === "string" ? o.photographer_name.trim() || null : null;
  if (photographer_name && photographer_name.length > MAX_NAME) return { ok: false, error: ERR_PHOTO_NAME_LONG };

  const photographer_phone =
    typeof o.photographer_phone === "string" ? o.photographer_phone.trim() || null : null;
  if (photographer_phone && photographer_phone.length > MAX_PHONE) return { ok: false, error: ERR_PHOTO_PHONE_LONG };

  const carpet_models = parseCarpetModels(o.carpet_models);
  if (carpet_models === null) return { ok: false, error: ERR_MODELS };

  return {
    ok: true,
    data: { project_name, address, photographer_name, photographer_phone, carpet_models },
  };
}

export function carpetModelsToJson(models: string[]): Json {
  return models;
}
