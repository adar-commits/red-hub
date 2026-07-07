import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ProjectPhotosAdminClient,
  type AdminProjectOption,
  type AdminProjectPhoto,
} from "@/components/admin/ProjectPhotosAdminClient";
import { PROJECT_PHOTOS_BUCKET } from "@/lib/designer-project-photos";

const SIGNED_URL_TTL = 3600;

export default async function AdminProjectPhotosPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: photos }, { data: projects }] = await Promise.all([
    supabase
      .from("project_photos")
      .select("id, designer_code, project_id, storage_path, description, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("designer_projects")
      .select("id, designer_code, project_name, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.project_name]));

  const initialPhotos: AdminProjectPhoto[] = await Promise.all(
    (photos ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(PROJECT_PHOTOS_BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
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

  const initialProjects: AdminProjectOption[] = (projects ?? []).map((p) => ({
    id: p.id,
    designer_code: p.designer_code,
    project_name: p.project_name,
    created_at: p.created_at,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">תמונות פרויקטים</h1>
      <ProjectPhotosAdminClient initialPhotos={initialPhotos} initialProjects={initialProjects} />
    </div>
  );
}
