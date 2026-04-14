import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireDesignerSession } from "@/lib/designer-api-auth";
import { PROJECT_PHOTOS_BUCKET } from "@/lib/designer-project-photos";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; photoId: string }> }
) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;
  const { id: projectId, photoId } = await context.params;
  if (!projectId || !photoId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = createServerSupabaseClient();
    const { data: project, error: pErr } = await supabase
      .from("designer_projects")
      .select("id")
      .eq("id", projectId)
      .eq("designer_code", auth.session.designerCode)
      .maybeSingle();

    if (pErr) {
      console.error("photo delete project", pErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!project) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const { data: photo, error: gErr } = await supabase
      .from("project_photos")
      .select("id, storage_path")
      .eq("id", photoId)
      .eq("project_id", projectId)
      .eq("designer_code", auth.session.designerCode)
      .maybeSingle();

    if (gErr) {
      console.error("photo delete get", gErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!photo) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const { error: dErr } = await supabase.from("project_photos").delete().eq("id", photoId);

    if (dErr) {
      console.error("photo delete db", dErr);
      return NextResponse.json({ error: "מחיקה נכשלה" }, { status: 500 });
    }

    const { error: stErr } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove([photo.storage_path]);
    if (stErr) console.error("photo delete storage", stErr);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("photo delete", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
