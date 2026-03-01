import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, message, read, created_at")
      .eq("designer_code", session.designerCode)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("notifications", e);
    return NextResponse.json([], { status: 200 });
  }
}
