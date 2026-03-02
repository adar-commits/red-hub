import { createClient } from "@supabase/supabase-js";

const BUCKET = "agent-data";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

async function ensureBucket(): Promise<void> {
  const sb = getSupabase();
  await sb.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 10 * 1024 * 1024 });
  // ignore error — bucket likely already exists
}

export async function saveCommissions(designerCode: string, certs: unknown[]): Promise<void> {
  await ensureBucket();
  const sb = getSupabase();
  const path = `commissions/${designerCode}.json`;
  const blob = new Blob([JSON.stringify(certs)], { type: "application/json" });
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: "application/json" });
  if (error) console.error("agent-store saveCommissions error:", error);
}

export async function loadCommissions(designerCode: string): Promise<unknown[]> {
  const sb = getSupabase();
  const path = `commissions/${designerCode}.json`;
  const { data, error } = await sb.storage.from(BUCKET).download(path);
  if (error || !data) return [];
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
