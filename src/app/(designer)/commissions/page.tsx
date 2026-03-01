import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { CommissionsClient } from "@/components/designer/CommissionsClient";

export default async function CommissionsPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">תעודות עמלה</h1>
      <p className="text-sm text-gray-600">
        במסך זה יוצגו תעודות עמלה מ-12 החודשים האחרונים
      </p>
      <CommissionsClient designerCode={session.designerCode} />
    </div>
  );
}
