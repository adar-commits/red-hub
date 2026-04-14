import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { DealsClient } from "@/components/designer/DealsClient";

export default async function DealsPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return <DealsClient designerCode={session.designerCode} />;
}
