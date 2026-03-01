import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { erpGetDeals } from "@/lib/erp";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await erpGetDeals(session.designerCode);
    return NextResponse.json(data);
  } catch (e) {
    if (String(e).includes("Missing env")) {
      return NextResponse.json({ deals: [], summary: {} });
    }
    console.error("deals", e);
    return NextResponse.json({ error: "Failed to load deals" }, { status: 500 });
  }
}
