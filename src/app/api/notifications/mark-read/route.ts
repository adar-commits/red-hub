import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const supabase = createServerSupabaseClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("designer_code", session.designerCode);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("notifications mark-read", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
