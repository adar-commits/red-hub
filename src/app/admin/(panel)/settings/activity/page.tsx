import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ActivityLogClient } from "@/components/admin/ActivityLogClient";
import { authOptions } from "@/lib/auth-options";
import { isAdminSettingsUser } from "@/lib/admin-settings-access";

export default async function AdminSettingsActivityPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminSettingsUser(session?.user?.email)) {
    redirect("/admin/settings");
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-[var(--brand-red)]">
          הגדרות
        </Link>
        <span aria-hidden>/</span>
        <span className="text-gray-700">מעקב פעילות</span>
      </div>
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">מעקב פעילות</h1>
      <ActivityLogClient />
    </div>
  );
}
