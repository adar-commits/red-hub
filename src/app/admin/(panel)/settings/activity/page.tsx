import Link from "next/link";
import { ActivityLogClient } from "@/components/admin/ActivityLogClient";

export default function AdminSettingsActivityPage() {
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
