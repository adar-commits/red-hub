import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireDesignerSession } from "@/lib/designer-api-auth";
import {
  ensureProjectPhotosBucket,
  isProbablyImageFile,
  objectPathForPhoto,
  PROJECT_PHOTO_MAX_FILE_BYTES,
  PROJECT_PHOTO_MAX_PER_DESIGNER_PER_HOUR,
  PROJECT_PHOTO_MAX_PER_PROJECT,
  PROJECT_PHOTOS_BUCKET,
} from "@/lib/designer-project-photos";

const SIGNED_URL_TTL = 3600;

/** Same default as commissions invoice; override per-event if needed. */
const MAKE_PROJECT_PHOTOS_WEBHOOK_URL =
  process.env.MAKE_PROJECT_PHOTOS_WEBHOOK_URL ??
  "https://hook.eu2.make.com/9yya0867dfwx3ivbx1au5wcqvmwl0pt5";

function appOriginFromRequest(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    /* ignore */
  }
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL;
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      /* ignore */
    }
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return vercel.startsWith("http") ? new URL(vercel).origin : `https://${vercel}`;
  }
  return "";
}

/** Public URL of the designer photos workspace for this project (`/photos/[projectId]`). */
function projectUrlFromRequest(request: Request, projectId: string): string | null {
  const origin = appOriginFromRequest(request);
  if (!origin) {
    console.warn(
      "projectUrl: could not resolve app origin — set VERCEL_URL, NEXT_PUBLIC_APP_URL, or APP_BASE_URL"
    );
    return null;
  }
  return `${origin}/photos/${projectId}`;
}

async function notifyProjectPhotosUploaded(opts: {
  projectUrl: string | null;
  agentCode: string;
}): Promise<void> {
  if (!opts.projectUrl) return;
  try {
    const res = await fetch(MAKE_PROJECT_PHOTOS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "project-photos",
        agentCode: opts.agentCode,
        projectUrl: opts.projectUrl,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("project-photos webhook", res.status, text.slice(0, 500));
    }
  } catch (e) {
    console.error("project-photos webhook fetch", e);
  }
}

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

    await ensureProjectPhotosBucket(supabase);

    const { error: upErr } = await supabase.storage.from(PROJECT_PHOTOS_BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });

    if (upErr) {
      console.error("storage upload", upErr.message, upErr);
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

    const projectUrl = projectUrlFromRequest(request, projectId);

    const [{ data: signed }] = await Promise.all([
      supabase.storage.from(PROJECT_PHOTOS_BUCKET).createSignedUrl(row.storage_path, SIGNED_URL_TTL),
      notifyProjectPhotosUploaded({
        projectUrl,
        agentCode: auth.session.designerCode,
      }),
    ]);

    return NextResponse.json({
      id: row.id,
      url: signed?.signedUrl ?? null,
      created_at: row.created_at,
      projectUrl,
    });
  } catch (e) {
    console.error("photos post", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
