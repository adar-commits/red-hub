import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectsPhotosHome } from "@/components/designer/ProjectsPhotosHome";
import type { DesignerProject } from "@/types/database";

export default async function PhotosPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  const supabase = createServerSupabaseClient();
  const { data: projects, error: listError } = await supabase
    .from("designer_projects")
    .select(
      "id, designer_code, project_name, address, photographer_name, photographer_phone, carpet_models, created_at, updated_at"
    )
    .eq("designer_code", session.designerCode)
    .order("created_at", { ascending: false });

  if (listError) {
    console.error("photos page: designer_projects", listError);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--brand-red)] sm:text-2xl">תמונות פרויקט</h1>
      <p className="text-sm text-gray-600">
        צרו פרויקט עם פרטים (כתובת, צלם, דגמים) והעלו תמונות לכל פרויקט בנפרד.
      </p>
      <ProjectsPhotosHome
        initialProjects={(projects ?? []) as DesignerProject[]}
        listError={
          listError
            ? "לא ניתן לטעון את רשימת הפרויקטים. ודאו שמיגרציית מסד הנתונים (כולל designer_projects) הורצה בסופאבייס ושהטבלה קיימת."
            : null
        }
      />
    </div>
  );
}
