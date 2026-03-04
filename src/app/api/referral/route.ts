import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { erpSubmitReferral } from "@/lib/erp";

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!phone) return NextResponse.json({ error: "טלפון חסר" }, { status: 400 });
    await erpSubmitReferral({
      actionType: "assignment",
      agentCode: session.designerCode,
      phone,
      optionalField: body.optionalField,
      optionalValue: body.optionalValue,
      declarationAccepted: Boolean(body.declarationAccepted),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (String(e).includes("Missing env")) {
      return NextResponse.json({ success: true });
    }
    console.error("referral", e);
    return NextResponse.json({ error: "שגיאה בשליחה" }, { status: 500 });
  }
}
