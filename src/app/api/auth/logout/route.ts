import { NextResponse } from "next/server";
import { getDesignerSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getDesignerSession();
    session.destroy();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
