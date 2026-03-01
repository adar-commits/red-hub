import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const [{ count: designersCount }, { count: announcementsCount }] = await Promise.all([
    supabase.from("designers").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">דשבורד</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">מעצבים</p>
          <p className="text-2xl font-bold">{designersCount ?? 0}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">הודעות</p>
          <p className="text-2xl font-bold">{announcementsCount ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
