import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { erpContact } from "@/lib/erp";

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "הודעה חסרה" }, { status: 400 });
    await erpContact(session.designerCode, message);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (String(e).includes("Missing env")) return NextResponse.json({ success: true });
    console.error("contact", e);
    return NextResponse.json({ error: "שגיאה בשליחה" }, { status: 500 });
  }
}
