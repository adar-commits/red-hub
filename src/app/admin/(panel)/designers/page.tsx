import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Designer } from "@/types/database";

export default async function AdminDesignersPage() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("designers")
    .select("designer_code, full_name, phone, email, business_name, status")
    .order("created_at", { ascending: false });

  const designers: Pick<Designer, "designer_code" | "full_name" | "phone" | "email" | "business_name" | "status">[] = data ?? [];

  if (error) {
    return <p className="text-red-600">שגיאה בטעינה</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">מעצבים</h1>
      <p className="text-sm text-gray-600">ייבוא CSV זמין בהגדרות. רשימה מהטבלה designers.</p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" dir="rtl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2.5 px-3 font-medium text-end">קוד</th>
              <th className="py-2.5 px-3 font-medium text-end">שם</th>
              <th className="py-2.5 px-3 font-medium text-end">טלפון</th>
              <th className="py-2.5 px-3 font-medium text-end">אימייל</th>
              <th className="py-2.5 px-3 font-medium text-end">עסק</th>
              <th className="py-2.5 px-3 font-medium text-end">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {designers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">אין מעצבים (ייבוא CSV)</td>
              </tr>
            ) : (
              designers.map((d) => (
                <tr key={d.designer_code} className="border-t border-gray-100">
                  <td className="py-2.5 px-3 text-end font-mono">{d.designer_code}</td>
                  <td className="py-2.5 px-3 text-end">{d.full_name ?? "—"}</td>
                  <td className="py-2.5 px-3 text-end" dir="ltr">{d.phone ?? "—"}</td>
                  <td className="py-2.5 px-3 text-end" dir="ltr">{d.email ?? "—"}</td>
                  <td className="py-2.5 px-3 text-end">{d.business_name ?? "—"}</td>
                  <td className="py-2.5 px-3 text-end">{d.status ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}