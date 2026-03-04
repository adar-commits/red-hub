import Link from "next/link";

export default function AdminSettingsGeneralPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-[var(--brand-red)]">
          הגדרות
        </Link>
        <span aria-hidden>/</span>
        <span className="text-gray-700">הגדרות כלליות</span>
      </div>
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">הגדרות כלליות</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        דף זה יוגדר בהמשך.
      </div>
    </div>
  );
}
