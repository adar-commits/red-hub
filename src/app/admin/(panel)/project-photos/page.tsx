import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectPhotosAdminClient } from "@/components/admin/ProjectPhotosAdminClient";
import { fetchAdminProjectPhotos } from "@/lib/admin-project-photos";

export default async function AdminProjectPhotosPage() {
  const supabase = createServerSupabaseClient();
  const initialPhotos = await fetchAdminProjectPhotos(supabase);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-red)]">תמונות פרויקטים</h1>
        <p className="text-sm text-gray-600 mt-1">
          כל התמונות שהועלו על ידי מעצבים — ממוינות מהחדש לישן.
        </p>
      </div>
      <ProjectPhotosAdminClient initialPhotos={initialPhotos} />
    </div>
  );
}
