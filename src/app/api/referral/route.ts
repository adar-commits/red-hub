import { NextResponse } from "next/server";
import { recordDesignerActivity } from "@/lib/designer-activity";
import { erpSubmitReferral } from "@/lib/erp";
import { getDesignerSession, isSessionExpired } from "@/lib/session";

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
    await recordDesignerActivity({
      activity_type: "commission_assignment_request",
      designer_code: session.designerCode,
      agent_name: session.fullName,
      phone: session.phone,
      metadata: {
        validationPhone: validationPhone.slice(0, 48),
        validationComSum: validationComSum.slice(0, 48),
        validationfieldType: validationfieldType.slice(0, 64),
        ...(description ? { webhookMessage: description.slice(0, 500) } : {}),
      },
    });
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
