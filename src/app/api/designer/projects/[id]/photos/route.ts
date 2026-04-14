import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireDesignerSession } from "@/lib/designer-api-auth";
import {
  isProbablyImageFile,
  objectPathForPhoto,
  PROJECT_PHOTO_MAX_FILE_BYTES,
  PROJECT_PHOTO_MAX_PER_DESIGNER_PER_HOUR,
  PROJECT_PHOTO_MAX_PER_PROJECT,
  PROJECT_PHOTOS_BUCKET,
} from "@/lib/designer-project-photos";

const SIGNED_URL_TTL = 3600;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = createServerSupabaseClient();
    const { data: project, error: pErr } = await supabase
      .from("designer_projects")
      .select("id")
      .eq("id", projectId)
      .eq("designer_code", auth.session.designerCode)
      .maybeSingle();

    if (pErr) {
      console.error("photos list project", pErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!project) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const { data: rows, error } = await supabase
      .from("project_photos")
      .select("id, storage_path, description, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("photos list", error);
      return NextResponse.json({ error: "שגיאה בטעינת תמונות" }, { status: 500 });
    }

    const photos = await Promise.all(
      (rows ?? []).map(async (row) => {
        const { data: signed, error: sErr } = await supabase.storage
          .from(PROJECT_PHOTOS_BUCKET)
          .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
        if (sErr) console.error("signed url", sErr);
        return {
          id: row.id,
          url: signed?.signedUrl ?? null,
          description: row.description,
          created_at: row.created_at,
        };
      })
    );

    return NextResponse.json(photos);
  } catch (e) {
    console.error("photos get", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = createServerSupabaseClient();
    const { data: project, error: pErr } = await supabase
      .from("designer_projects")
      .select("id")
      .eq("id", projectId)
      .eq("designer_code", auth.session.designerCode)
      .maybeSingle();

    if (pErr) {
      console.error("photos upload project", pErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!project) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount, error: hErr } = await supabase
      .from("project_photos")
      .select("id", { count: "exact", head: true })
      .eq("designer_code", auth.session.designerCode)
      .gte("created_at", since);

    if (hErr) {
      console.error("photos hourly count", hErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if ((hourlyCount ?? 0) >= PROJECT_PHOTO_MAX_PER_DESIGNER_PER_HOUR) {
      return NextResponse.json(
        { error: "הגעת למגבלת העלאות לשעה. נסה שוב מאוחר יותר." },
        { status: 429 }
      );
    }

    const { count: projectCount, error: cErr } = await supabase
      .from("project_photos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (cErr) {
      console.error("photos project count", cErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if ((projectCount ?? 0) >= PROJECT_PHOTO_MAX_PER_PROJECT) {
      return NextResponse.json(
        { error: "הגעת למגבלת התמונות לפרויקט זה." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || !isProbablyImageFile(file)) {
      return NextResponse.json({ error: "יש לצרף קובץ תמונה תקין" }, { status: 400 });
    }
    if (file.size > PROJECT_PHOTO_MAX_FILE_BYTES) {
      return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 12MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = objectPathForPhoto(auth.session.designerCode, projectId, file);
    const contentType = file.type || "application/octet-stream";

    const { error: upErr } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });

    if (upErr) {
      console.error("storage upload", upErr);
      return NextResponse.json({ error: "העלאה לשרת האחסון נכשלה" }, { status: 502 });
    }

    const { data: row, error: insErr } = await supabase
      .from("project_photos")
      .insert({
        designer_code: auth.session.designerCode,
        project_id: projectId,
        storage_path: path,
        image_url: null,
      })
      .select("id, storage_path, created_at")
      .single();

    if (insErr || !row) {
      console.error("project_photos insert", insErr);
      await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove([path]);
      return NextResponse.json({ error: "שמירת התמונה נכשלה" }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from(PROJECT_PHOTOS_BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_URL_TTL);

    return NextResponse.json({
      id: row.id,
      url: signed?.signedUrl ?? null,
      created_at: row.created_at,
    });
  } catch (e) {
    console.error("photos post", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
