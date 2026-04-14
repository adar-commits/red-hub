import { redirect, notFound } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectPhotosWorkspace } from "@/components/designer/ProjectPhotosWorkspace";
import type { DesignerProject } from "@/types/database";

export default async function PhotosProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  const { projectId } = await params;
  if (!projectId) notFound();

  const supabase = createServerSupabaseClient();
  const { data: project, error } = await supabase
    .from("designer_projects")
    .select(
      "id, designer_code, project_name, address, photographer_name, photographer_phone, carpet_models, created_at, updated_at"
    )
    .eq("id", projectId)
    .eq("designer_code", session.designerCode)
    .maybeSingle();

  if (error || !project) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--brand-red)] sm:text-2xl">{project.project_name}</h1>
      <p className="text-sm text-gray-600">עריכת פרטים והעלאת תמונות לפרויקט</p>
      <ProjectPhotosWorkspace projectId={project.id} initialProject={project as DesignerProject} />
    </div>
  );
}
