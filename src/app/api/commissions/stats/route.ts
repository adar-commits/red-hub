import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ERP would return commission stats; until then return zeros
    return NextResponse.json({
      pendingApproval: 0,
      unpaid: 0,
      paid: 0,
    });
  } catch {
    return NextResponse.json({ pendingApproval: 0, unpaid: 0, paid: 0 });
  }
}
