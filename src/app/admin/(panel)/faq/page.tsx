import { fetchFaqDocumentFromDb } from "@/lib/faq-db";
import { FaqAdminClient } from "@/components/admin/FaqAdminClient";

export default async function AdminFaqPage() {
  const doc = await fetchFaqDocumentFromDb();
  if (!doc) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900" dir="rtl">
        <p className="font-semibold">לא נמצא תוכן FAQ במסד הנתונים.</p>
        <p className="mt-2 text-sm">
          הריצו את מיגרציית Supabase{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">00005_faq_content.sql</code> והפעילו מחדש את
          האפליקציה.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div dir="rtl">
        <h1 className="text-2xl font-bold text-[var(--brand-red)]">שאלות נפוצות (FAQ)</h1>
        <p className="mt-1 text-sm text-gray-600">
          עריכה מלאה של עמוד ה-FAQ למעצבים — כותרות, סרטון YouTube, מקטעים, שאלות ותשובות.
        </p>
      </div>
      <FaqAdminClient initial={doc} />
    </div>
  );
}
