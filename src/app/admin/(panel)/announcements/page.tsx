import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AnnouncementsClient } from "@/components/admin/AnnouncementsClient";

export default async function AdminAnnouncementsPage() {
  const supabase = createServerSupabaseClient();
  const { data: list } = await supabase
    .from("announcements")
    .select("id, title, content, is_published, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">הודעות</h1>
      <AnnouncementsClient initialList={list ?? []} />
    </div>
  );
}
