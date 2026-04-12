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
    const validationPhone = typeof body.validationPhone === "string" ? body.validationPhone.trim() : "";
    const validationComSum = typeof body.validationComSum === "string" ? body.validationComSum.trim() : "";
    const validationfieldType = typeof body.validationfieldType === "string" ? body.validationfieldType.trim() : "";
    const validationfieldValue = typeof body.validationfieldValue === "string" ? body.validationfieldValue.trim() : "";

    if (!validationPhone) return NextResponse.json({ error: "טלפון חסר" }, { status: 400 });
    if (!validationComSum) return NextResponse.json({ error: "סכום חסר" }, { status: 400 });
    if (!validationfieldType) return NextResponse.json({ error: "שדה אימות חסר" }, { status: 400 });
    if (!validationfieldValue) return NextResponse.json({ error: "ערך שדה אימות חסר" }, { status: 400 });

    const webhookResult = await erpSubmitReferral({
      validationPhone,
      validationComSum,
      validationfieldType,
      validationfieldValue,
      eventType: "commisionRequest",
      agentCode: session.designerCode,
      assignmentType: "invoice",
    });
    const description =
      (typeof webhookResult?.response === "string" && webhookResult.response.trim()) ||
      (typeof webhookResult?.respond === "string" && webhookResult.respond.trim()) ||
      null;
    return NextResponse.json({ success: true, message: description });
  } catch (e) {
    if (String(e).includes("Missing env")) {
      return NextResponse.json({ success: true });
    }
    console.error("referral", e);
    const errorMessage = e instanceof Error && e.message ? e.message : "שגיאה בשליחה";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
