import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireDesignerSession } from "@/lib/designer-api-auth";
import { carpetModelsToJson, ERR_INVALID_BODY, normalizeProjectBody } from "@/lib/designer-project-body";
import { PROJECT_PHOTOS_BUCKET } from "@/lib/designer-project-photos";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("designer_projects")
      .select(
        "id, designer_code, project_name, address, photographer_name, photographer_phone, carpet_models, created_at, updated_at"
      )
      .eq("id", id)
      .eq("designer_code", auth.session.designerCode)
      .maybeSingle();

    if (error) {
      console.error("designer project get", error);
      return NextResponse.json({ error: "שגיאה בטעינת פרויקט" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("designer project get", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: ERR_INVALID_BODY }, { status: 400 });
  }

  const parsed = normalizeProjectBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("designer_projects")
      .update({
        project_name: parsed.data.project_name,
        address: parsed.data.address,
        photographer_name: parsed.data.photographer_name,
        photographer_phone: parsed.data.photographer_phone,
        carpet_models: carpetModelsToJson(parsed.data.carpet_models),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("designer_code", auth.session.designerCode)
      .select(
        "id, designer_code, project_name, address, photographer_name, photographer_phone, carpet_models, created_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      console.error("designer project patch", error);
      return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("designer project patch", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = createServerSupabaseClient();
    const { data: project, error: pErr } = await supabase
      .from("designer_projects")
      .select("id")
      .eq("id", id)
      .eq("designer_code", auth.session.designerCode)
      .maybeSingle();

    if (pErr) {
      console.error("designer project delete lookup", pErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!project) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const { data: photos, error: phErr } = await supabase
      .from("project_photos")
      .select("storage_path")
      .eq("project_id", id);

    if (phErr) {
      console.error("designer project delete photos list", phErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }

    const paths = (photos ?? []).map((p) => p.storage_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: stErr } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove(paths);
      if (stErr) console.error("designer project delete storage", stErr);
    }

    const { error: delErr } = await supabase
      .from("designer_projects")
      .delete()
      .eq("id", id)
      .eq("designer_code", auth.session.designerCode);

    if (delErr) {
      console.error("designer project delete", delErr);
      return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("designer project delete", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
