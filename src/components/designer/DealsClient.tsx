"use client";

import { useEffect, useState } from "react";
import { ReferralModal } from "./ReferralModal";

interface DealRow {
  id?: string;
  invoice_date?: string;
  customer_name?: string;
  phone?: string;
  amount_excl_vat?: number;
  commission?: number;
  status?: string;
}

export function DealsClient({ designerCode }: { designerCode: string }) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralOpen, setReferralOpen] = useState(false);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => {
        const list = data?.deals ?? data ?? [];
        setDeals(Array.isArray(list) ? list : []);
      })
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  function exportExcel() {
    const headers = ["תאריך החשבונית", "שם לקוח", "טלפון", "סכום ללא מע״מ", "עמלה", "סטטוס"];
    const rows = deals.map((d) => [
      d.invoice_date ?? "",
      d.customer_name ?? "",
      d.phone ?? "",
      d.amount_excl_vat ?? "",
      d.commission ?? "",
      d.status ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deals.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-48 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
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
          הוספת עסקה חדשה / הפניה
        </button>
        <button
          type="button"
          onClick={exportExcel}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
        >
          ייצוא לאקסל
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              <th className="text-right py-2 px-3">תאריך החשבונית</th>
              <th className="text-right py-2 px-3">שם לקוח</th>
              <th className="text-right py-2 px-3">טלפון</th>
              <th className="text-right py-2 px-3">סכום ללא מע״מ</th>
              <th className="text-right py-2 px-3">עמלה</th>
              <th className="text-right py-2 px-3">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  אין תוצאות
                </td>
              </tr>
            ) : (
              deals.map((d, i) => (
                <tr key={d.id ?? i} className="border-t border-gray-100">
                  <td className="py-2 px-3">{d.invoice_date ? new Date(d.invoice_date).toLocaleDateString("he-IL") : "—"}</td>
                  <td className="py-2 px-3">{d.customer_name ?? "—"}</td>
                  <td className="py-2 px-3" dir="ltr">{d.phone ?? "—"}</td>
                  <td className="py-2 px-3">{d.amount_excl_vat != null ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(d.amount_excl_vat) : "—"}</td>
                  <td className="py-2 px-3">{d.commission != null ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(d.commission) : "—"}</td>
                  <td className="py-2 px-3"><StatusBadge status={d.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReferralModal
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        designerCode={designerCode}
        onSuccess={() => setReferralOpen(false)}
      />
    </>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const style = s.includes("אושר") || s.includes("approved") ? "bg-green-100 text-green-800" : s.includes("ממתין") || s.includes("pending") ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 rounded text-xs ${style}`}>{status || "—"}</span>;
}
