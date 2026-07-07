import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ensureProjectPhotosBucket,
  isProbablyImageFile,
  objectPathForPhoto,
  PROJECT_PHOTO_MAX_FILE_BYTES,
  PROJECT_PHOTOS_BUCKET,
} from "@/lib/designer-project-photos";

const SIGNED_URL_TTL = 3600;

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null };
}

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const supabase = createServerSupabaseClient();

    const [{ data: photos, error: pErr }, { data: projects, error: prErr }] = await Promise.all([
      supabase
        .from("project_photos")
        .select("id, designer_code, project_id, storage_path, description, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("designer_projects")
        .select("id, designer_code, project_name, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (pErr) {
      console.error("admin project-photos list", pErr);
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    if (prErr) {
      console.error("admin project-photos projects", prErr);
      return NextResponse.json({ error: prErr.message }, { status: 500 });
    }

    const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.project_name]));

    const enriched = await Promise.all(
      (photos ?? []).map(async (row) => {
        const { data: signed, error: sErr } = await supabase.storage
          .from(PROJECT_PHOTOS_BUCKET)
          .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
        if (sErr) console.error("admin signed url", sErr);
        return {
          id: row.id,
          url: signed?.signedUrl ?? null,
          storage_path: row.storage_path,
          designer_code: row.designer_code,
          project_id: row.project_id,
          project_name: projectNameById.get(row.project_id) ?? null,
          description: row.description,
          created_at: row.created_at,
        };
      })
    );

    return NextResponse.json({
      photos: enriched,
      projects: projects ?? [],
      stats: { total: enriched.length },
    });
  } catch (e) {
    console.error("admin project-photos get", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const supabase = createServerSupabaseClient();
    const formData = await request.formData();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const file = formData.get("file") as File | null;

    if (!projectId) {
      return NextResponse.json({ error: "יש לבחור פרויקט" }, { status: 400 });
    }
    if (!file || !(file instanceof File) || !isProbablyImageFile(file)) {
      return NextResponse.json({ error: "יש לצרף קובץ תמונה תקין" }, { status: 400 });
    }
    if (file.size > PROJECT_PHOTO_MAX_FILE_BYTES) {
      return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 12MB)" }, { status: 400 });
    }

    const { data: project, error: pErr } = await supabase
      .from("designer_projects")
      .select("id, designer_code")
      .eq("id", projectId)
      .maybeSingle();

    if (pErr) {
      console.error("admin project-photos upload project", pErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!project) {
      return NextResponse.json({ error: "פרויקט לא נמצא" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = objectPathForPhoto(project.designer_code, projectId, file);
    const contentType = file.type || "application/octet-stream";

    await ensureProjectPhotosBucket(supabase);

    const { error: upErr } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });

    if (upErr) {
      console.error("admin storage upload", upErr.message, upErr);
      return NextResponse.json(
        {
          error: "העלאה לשרת האחסון נכשלה",
          detail: process.env.NODE_ENV === "development" ? upErr.message : undefined,
        },
        { status: 502 }
      );
    }

    const { data: row, error: insErr } = await supabase
      .from("project_photos")
      .insert({
        designer_code: project.designer_code,
        project_id: projectId,
        storage_path: path,
        image_url: null,
        description: "העלאת בדיקה (מנהל)",
      })
      .select("id, storage_path, created_at, description")
      .single();

    if (insErr || !row) {
      console.error("admin project_photos insert", insErr);
      await supabase.storage.from(PROJECT_PHOTOS_BUCKET).remove([path]);
      return NextResponse.json({ error: "שמירת התמונה נכשלה" }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from(PROJECT_PHOTOS_BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_URL_TTL);

    return NextResponse.json({
      id: row.id,
      url: signed?.signedUrl ?? null,
      storage_path: row.storage_path,
      designer_code: project.designer_code,
      project_id: projectId,
      description: row.description,
      created_at: row.created_at,
    });
  } catch (e) {
    console.error("admin project-photos post", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
