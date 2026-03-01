import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { DashboardClient } from "@/components/designer/DashboardClient";

export default async function DashboardPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">מסך הבית</h1>
      <DashboardClient designerCode={session.designerCode} />
    </div>
  );
}
