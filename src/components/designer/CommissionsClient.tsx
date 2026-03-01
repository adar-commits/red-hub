"use client";

import { useEffect, useState } from "react";
import { ReferralModal } from "./ReferralModal";

interface CertRow {
  id?: string;
  created_at?: string;
  certificate_number?: string;
  transaction_count?: number;
  commission?: number;
  status?: string;
}

interface CommissionStats {
  pendingApproval: number;
  unpaid: number;
  paid: number;
}

export function CommissionsClient({ designerCode }: { designerCode: string }) {
  const [stats, setStats] = useState<CommissionStats>({ pendingApproval: 0, unpaid: 0, paid: 0 });
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralOpen, setReferralOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/commissions/stats"), fetch("/api/commissions/certificates")])
      .then(async ([sRes, cRes]) => {
        const s = await sRes.json();
        const c = await cRes.json();
        setStats(s.error ? { pendingApproval: 0, unpaid: 0, paid: 0 } : s);
        setCerts(Array.isArray(c) ? c : c?.certificates ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/commissions/upload-invoice", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setCerts((prev) => [{ ...data, created_at: new Date().toISOString(), status: "ממתין לאישור" }, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setReferralOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--sidebar-bg)] text-white text-sm font-medium"
        >
          הפניה חדשה
        </button>
        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium cursor-pointer hover:bg-gray-50">
          <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading ? "מעלה..." : "העלאת חשבונית"}
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-red-600 text-white">
          <p className="text-sm opacity-90">עמלות הממתינות לאישור</p>
          <p className="text-2xl font-bold">{stats.pendingApproval}</p>
        </div>
        <div className="p-4 rounded-xl bg-teal-700 text-white">
          <p className="text-sm opacity-90">עמלות שטרם שולמו</p>
          <p className="text-2xl font-bold">{stats.unpaid}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-600 text-white">
          <p className="text-sm opacity-90">עמלות שולמו</p>
          <p className="text-2xl font-bold">{stats.paid}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              <th className="text-right py-2 px-3">נוצרה בתאריך</th>
              <th className="text-right py-2 px-3">מספר תעודה</th>
              <th className="text-right py-2 px-3">כמות עסקאות</th>
              <th className="text-right py-2 px-3">עמלה</th>
              <th className="text-right py-2 px-3">סטטוס</th>
              <th className="text-right py-2 px-3">צפייה בעסקאות</th>
            </tr>
          </thead>
          <tbody>
            {certs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">אין תוצאות</td>
              </tr>
            ) : (
              certs.map((c, i) => (
                <tr key={c.id ?? i} className="border-t border-gray-100">
                  <td className="py-2 px-3">{c.created_at ? new Date(c.created_at).toLocaleDateString("he-IL") : "—"}</td>
                  <td className="py-2 px-3">{c.certificate_number ?? "—"}</td>
                  <td className="py-2 px-3">{c.transaction_count ?? "—"}</td>
                  <td className="py-2 px-3">{c.commission != null ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(c.commission) : "—"}</td>
                  <td className="py-2 px-3">{c.status ?? "—"}</td>
                  <td className="py-2 px-3">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReferralModal open={referralOpen} onClose={() => setReferralOpen(false)} designerCode={designerCode} onSuccess={() => setReferralOpen(false)} />
    </>
  );
}
