import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, image_url, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e) {
    console.error("announcements", e);
    return NextResponse.json([], { status: 200 });
  }
}
