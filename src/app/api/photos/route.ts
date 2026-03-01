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
      .from("project_photos")
      .select("id, image_url, description, created_at")
      .eq("designer_code", session.designerCode)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("photos get", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "קובץ חסר" }, { status: 400 });
    const supabase = createServerSupabaseClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${session.designerCode}/${Date.now()}.${ext}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("project-photos").getPublicUrl(upload.path);
    const { data: row, error: insertError } = await supabase
      .from("project_photos")
      .insert({ designer_code: session.designerCode, image_url: urlData.publicUrl, description: null })
      .select("id, image_url, description, created_at")
      .single();
    if (insertError) throw insertError;
    return NextResponse.json(row);
  } catch (e) {
    console.error("photos post", e);
    return NextResponse.json({ error: "שגיאה בהעלאה" }, { status: 500 });
  }
}
