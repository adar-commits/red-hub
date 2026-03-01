import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProjectPhoto } from "@/types/database";

export default async function AdminPhotosPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("project_photos")
    .select("id, designer_code, image_url, description, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const photos: ProjectPhoto[] = data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">תמונות פרויקט</h1>
      <p className="text-sm text-gray-600">תמונות שהעלו מעצבים (לצפייה בלבד)</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="rounded-lg border overflow-hidden bg-white">
            <img src={p.image_url} alt="" className="w-full aspect-square object-cover" />
            <p className="p-2 text-xs text-gray-500">קוד: {p.designer_code}</p>
          </div>
        ))}
      </div>
      {photos.length === 0 && <p className="text-gray-500">אין תמונות</p>}
    </div>
  );
}
