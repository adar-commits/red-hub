import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { FaqPageContent } from "@/components/designer/FaqPageContent";

export default async function FAQPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return <FaqPageContent />;
}
