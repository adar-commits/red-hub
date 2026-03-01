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
    const raw = data as { deals?: unknown[]; totalEarned?: number; pendingCommission?: number; dealsThisMonth?: number; lastPayment?: { amount: number; date: string }; openReferrals?: number };
    return NextResponse.json({
      totalEarned: raw.totalEarned ?? 0,
      pendingCommission: raw.pendingCommission ?? 0,
      dealsThisMonth: raw.dealsThisMonth ?? (Array.isArray(raw.deals) ? raw.deals.length : 0),
      lastPayment: raw.lastPayment ?? null,
      openReferrals: raw.openReferrals ?? 0,
    });
  } catch {
    return NextResponse.json({
      totalEarned: 0,
      pendingCommission: 0,
      dealsThisMonth: 0,
      lastPayment: null,
      openReferrals: 0,
    });
  }
}
