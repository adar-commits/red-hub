import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { FaqPageContent } from "@/components/designer/FaqPageContent";
import { fetchFaqDocumentFromDb } from "@/lib/faq-db";
import { FAQ_STATIC_FALLBACK } from "@/lib/faq-fallback";

export default async function FAQPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  const fromDb = await fetchFaqDocumentFromDb();
  const data = fromDb ?? FAQ_STATIC_FALLBACK;

  return <FaqPageContent data={data} />;
}
