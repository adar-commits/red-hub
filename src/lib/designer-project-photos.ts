import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isProbablyImageFile,
  PROJECT_CREATE_MAX_PER_DESIGNER_PER_DAY,
  PROJECT_PHOTO_MAX_FILE_BYTES,
  PROJECT_PHOTO_MAX_PER_DESIGNER_PER_HOUR,
  PROJECT_PHOTO_MAX_PER_PROJECT,
  PROJECT_PHOTOS_BUCKET,
} from "@/lib/designer-project-photos-shared";

export {
  isProbablyImageFile,
  PROJECT_CREATE_MAX_PER_DESIGNER_PER_DAY,
  PROJECT_PHOTO_MAX_FILE_BYTES,
  PROJECT_PHOTO_MAX_PER_DESIGNER_PER_HOUR,
  PROJECT_PHOTO_MAX_PER_PROJECT,
  PROJECT_PHOTOS_BUCKET,
} from "@/lib/designer-project-photos-shared";

/** Create private bucket if missing (service role). Safe to call before each upload. */
export async function ensureProjectPhotosBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("ensureProjectPhotosBucket listBuckets:", listErr.message);
    return;
  }
  if (buckets?.some((b) => b.name === PROJECT_PHOTOS_BUCKET)) return;
  const { error: createErr } = await supabase.storage.createBucket(PROJECT_PHOTOS_BUCKET, {
    public: false,
    fileSizeLimit: PROJECT_PHOTO_MAX_FILE_BYTES,
  });
  if (createErr) {
    const m = createErr.message.toLowerCase();
    if (m.includes("already") || m.includes("exists") || m.includes("duplicate")) return;
    console.error("ensureProjectPhotosBucket createBucket:", createErr.message);
  }
}

export function extensionForUpload(file: File): string {
  const name = file.name.trim();
  const fromName = name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    if (fromName === "jpeg") return "jpg";
    return fromName;
  }
  const t = file.type;
  if (t === "image/jpeg") return "jpg";
  if (t === "image/png") return "png";
  if (t === "image/gif") return "gif";
  if (t === "image/webp") return "webp";
  if (t === "image/heic" || t === "image/heif") return "heic";
  return "jpg";
}

export function objectPathForPhoto(designerCode: string, projectId: string, file: File): string {
  const ext = extensionForUpload(file);
  const id = randomUUID();
  return `${designerCode}/${projectId}/${id}.${ext}`;
}
