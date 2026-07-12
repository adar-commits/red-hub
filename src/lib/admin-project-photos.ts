import type { SupabaseClient } from "@supabase/supabase-js";
import { PROJECT_PHOTOS_BUCKET } from "@/lib/designer-project-photos";

const SIGNED_URL_TTL = 3600;

export type AdminProjectPhotoRow = {
  id: string;
  url: string | null;
  download_url: string;
  storage_path: string;
  designer_code: string;
  designer_name: string | null;
  designer_phone: string | null;
  project_id: string;
  project_name: string | null;
  description: string | null;
  created_at: string;
  filename: string;
};

function filenameFromStoragePath(storagePath: string): string {
  const base = storagePath.split("/").pop() ?? "project-photo";
  return base.includes(".") ? base : `${base}.jpg`;
}

export async function fetchAdminProjectPhotos(
  supabase: SupabaseClient
): Promise<AdminProjectPhotoRow[]> {
  const [{ data: photos, error: pErr }, { data: projects, error: prErr }, { data: designers, error: dErr }] =
    await Promise.all([
      supabase
        .from("project_photos")
        .select("id, designer_code, project_id, storage_path, description, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("designer_projects").select("id, project_name"),
      supabase.from("designers").select("designer_code, full_name, phone"),
    ]);

  if (pErr) throw pErr;
  if (prErr) throw prErr;
  if (dErr) throw dErr;

  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.project_name]));
  const designerByCode = new Map(
    (designers ?? []).map((d) => [d.designer_code, { full_name: d.full_name, phone: d.phone }])
  );

  return Promise.all(
    (photos ?? []).map(async (row) => {
      const filename = filenameFromStoragePath(row.storage_path);
      const { data: signed, error: sErr } = await supabase.storage
        .from(PROJECT_PHOTOS_BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL, { download: filename });
      if (sErr) console.error("admin signed url", sErr);

      const designer = designerByCode.get(row.designer_code);

      return {
        id: row.id,
        url: signed?.signedUrl ?? null,
        download_url: `/api/admin/project-photos/${row.id}/download`,
        storage_path: row.storage_path,
        designer_code: row.designer_code,
        designer_name: designer?.full_name ?? null,
        designer_phone: designer?.phone ?? null,
        project_id: row.project_id,
        project_name: projectNameById.get(row.project_id) ?? null,
        description: row.description,
        created_at: row.created_at,
        filename,
      };
    })
  );
}
