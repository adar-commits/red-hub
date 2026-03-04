import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { BusinessCardForm } from "@/components/designer/BusinessCardForm";

export default async function BusinessPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-red)]">פרטי העסק</h1>
        <p className="text-gray-600 text-sm mt-1">עדכן את פרטי העסק והפרופיל המקצועי שלך</p>
      </div>
      <BusinessCardForm />
    </div>
  );
}
