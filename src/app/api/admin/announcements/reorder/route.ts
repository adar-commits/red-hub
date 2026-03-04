import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const order = body.order;
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "order array required" }, { status: 400 });
  }
  const supabase = createServerSupabaseClient();
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    if (typeof id !== "string") continue;
    const { error } = await supabase.from("announcements").update({ sort_order: i }).eq("id", id);
    if (error) {
      console.warn("announcements reorder (sort_order column may be missing):", error.message);
    }
  }
  return NextResponse.json({ success: true });
}
