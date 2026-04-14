import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { CommissionsClient } from "@/components/designer/CommissionsClient";

export default async function CommissionsPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return <CommissionsClient designerCode={session.designerCode} />;
}
