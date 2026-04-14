import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { loadCommissions } from "@/lib/agent-store";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await loadCommissions(session.designerCode);
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error("commissions/certificates GET", e);
    return NextResponse.json([]);
  }
}
