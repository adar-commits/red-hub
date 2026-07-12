import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PROJECT_PHOTOS_BUCKET } from "@/lib/designer-project-photos";

const SIGNED_URL_TTL = 3600;

function filenameFromStoragePath(storagePath: string): string {
  const base = storagePath.split("/").pop() ?? "project-photo";
  return base.includes(".") ? base : `${base}.jpg`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = createServerSupabaseClient();
    const { data: photo, error } = await supabase
      .from("project_photos")
      .select("id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("admin project-photo download lookup", error);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if (!photo) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const { data: blob, error: dlErr } = await supabase.storage
      .from(PROJECT_PHOTOS_BUCKET)
      .download(photo.storage_path);

    if (dlErr || !blob) {
      console.error("admin project-photo download storage", dlErr);
      return NextResponse.json({ error: "הורדת הקובץ נכשלה" }, { status: 502 });
    }

    const filename = filenameFromStoragePath(photo.storage_path);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const contentType = blob.type || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("admin project-photo download", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
