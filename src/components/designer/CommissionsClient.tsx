"use client";

import { useEffect, useState } from "react";
import { ReferralModal } from "./ReferralModal";

interface CertRow {
  id?: string;
  date?: string;
  updated_at?: string;
  customer?: string;
  amount?: number;
  commission?: number;
  invoice_code?: string;
  recon_date?: string | null;
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
    const raw = sessionStorage.getItem("commissions");
    const parsed: CertRow[] = raw ? (JSON.parse(raw) as CertRow[]) : [];
    setCerts(parsed);

    const paid = parsed.filter((c) => c.recon_date).length;
    const unpaid = parsed.filter((c) => !c.recon_date && (c.commission ?? 0) > 0).length;
    setStats({ pendingApproval: 0, unpaid, paid });

    setLoading(false);
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
      setCerts((prev) => [{ ...data, date: new Date().toISOString() }, ...prev]);
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
              <th className="text-right py-2 px-3">תאריך</th>
              <th className="text-right py-2 px-3">מספר תעודה</th>
              <th className="text-right py-2 px-3">לקוח</th>
              <th className="text-right py-2 px-3">סכום</th>
              <th className="text-right py-2 px-3">עמלה</th>
              <th className="text-right py-2 px-3">תאריך פירעון</th>
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
                  <td className="py-2 px-3">{c.date ? new Date(c.date).toLocaleDateString("he-IL") : "—"}</td>
                  <td className="py-2 px-3">{c.id ?? "—"}</td>
                  <td className="py-2 px-3">{c.customer ?? "—"}</td>
                  <td className="py-2 px-3">{c.amount != null ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(c.amount) : "—"}</td>
                  <td className="py-2 px-3">{c.commission != null ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(c.commission) : "—"}</td>
                  <td className="py-2 px-3">{c.recon_date ? new Date(c.recon_date).toLocaleDateString("he-IL") : "—"}</td>
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
