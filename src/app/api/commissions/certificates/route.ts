import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}
