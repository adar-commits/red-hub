import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { DashboardClient } from "@/components/designer/DashboardClient";

export default async function DashboardPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return <DashboardClient designerCode={session.designerCode} />;
}
