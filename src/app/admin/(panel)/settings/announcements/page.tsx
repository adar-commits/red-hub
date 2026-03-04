import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsAnnouncementsClient } from "@/components/admin/SettingsAnnouncementsClient";

export default async function AdminSettingsAnnouncementsPage() {
  const supabase = createServerSupabaseClient();
  const { data: list } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-[var(--brand-red)]">
          הגדרות
        </Link>
        <span aria-hidden>/</span>
        <span className="text-gray-700">ניהול עדכונים</span>
      </div>
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">ניהול עדכונים</h1>
      <p className="text-sm text-gray-600">
        עדכונים אלה מוצגים במסך הבית של המעצבים. גרור לשינוי סדר.
      </p>
      <SettingsAnnouncementsClient initialList={list ?? []} />
    </div>
  );
}
