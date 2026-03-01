import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { PhotosClient } from "@/components/designer/PhotosClient";

export default async function PhotosPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">תמונות פרויקט</h1>
      <p className="text-sm text-gray-600">העלאת תמונות לפרויקטים (לשימוש פנימי)</p>
      <PhotosClient designerCode={session.designerCode} />
    </div>
  );
}
