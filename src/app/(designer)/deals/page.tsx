import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { DealsClient } from "@/components/designer/DealsClient";

export default async function DealsPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">העסקאות שלי</h1>
      <p className="text-sm text-gray-600">
        במסך זה יוצגו כל ההזמנות המשויכות אליך, לאחר 14 יום הם ישוכיו אוטומטית לתעודת עמלה.
      </p>
      <DealsClient designerCode={session.designerCode} />
    </div>
  );
}
