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
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-right py-2 px-3">קוד</th>
              <th className="text-right py-2 px-3">שם</th>
              <th className="text-right py-2 px-3">טלפון</th>
              <th className="text-right py-2 px-3">אימייל</th>
              <th className="text-right py-2 px-3">עסק</th>
              <th className="text-right py-2 px-3">סטטוס</th>
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
                  <td className="py-2 px-3 font-mono">{d.designer_code}</td>
                  <td className="py-2 px-3">{d.full_name ?? "—"}</td>
                  <td className="py-2 px-3" dir="ltr">{d.phone ?? "—"}</td>
                  <td className="py-2 px-3" dir="ltr">{d.email ?? "—"}</td>
                  <td className="py-2 px-3">{d.business_name ?? "—"}</td>
                  <td className="py-2 px-3">{d.status ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}