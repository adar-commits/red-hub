import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { loadCommissions } from "@/lib/agent-store";

interface RawCert {
  IVNUM?: string;
  IVDATE?: string;
  UDATE?: string;
  COMMISSION?: number;
  IVCODE?: string;
  STATDES?: string;
  [key: string]: unknown;
}

function mapToCertRow(raw: RawCert) {
  return {
    id: raw.IVNUM,
    created_at: raw.UDATE ?? raw.IVDATE,
    certificate_number: raw.IVNUM,
    transaction_count: 1,
    commission: raw.COMMISSION,
    status: raw.STATDES ?? raw.IVCODE ?? "—",
  };
}

export async function GET() {
  const session = await getDesignerSession();
  if (!session?.designerCode || isSessionExpired(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = (await loadCommissions(session.designerCode)) as RawCert[];
  const certs = raw.map(mapToCertRow);
  return NextResponse.json(certs);
}
