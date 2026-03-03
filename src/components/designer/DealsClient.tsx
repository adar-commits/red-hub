"use client";

import { useEffect, useState } from "react";
import { ReferralModal } from "./ReferralModal";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";

interface DealRow {
  id?: string;
  invoice_date?: string;
  customer_name?: string;
  phone?: string;
  amount_excl_vat?: number;
  commission?: number;
  status?: string;
}

const DEAL_COLUMNS: SortFilterColumn<DealRow>[] = [
  { key: "invoice_date", label: "תאריך החשבונית" },
  { key: "customer_name", label: "שם לקוח" },
  { key: "phone", label: "טלפון" },
  { key: "amount_excl_vat", label: "סכום ללא מע״מ" },
  { key: "commission", label: "עמלה" },
  { key: "status", label: "סטטוס" },
];

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

  const {
    searchQuery,
    setSearchQuery,
    filteredSortedRows,
    sortKey,
    sortDir,
    toggleSort,
    exportCsv,
    searchPlaceholder,
  } = useSortAndFilter(deals, DEAL_COLUMNS, { searchPlaceholder: "חיפוש בעסקאות..." });

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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--sidebar-bg)] text-white text-sm font-medium hover:bg-[var(--sidebar-bg)]/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/20"
        >
          הוספת עסקה חדשה / הפניה
        </button>
      </div>

      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCsv={() => exportCsv("deals.csv")}
        searchPlaceholder={searchPlaceholder}
        exportLabel="ייצוא CSV"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              {DEAL_COLUMNS.map((col) => (
                <th
                  key={String(col.key)}
                  className="text-right py-2 px-3 cursor-pointer select-none hover:bg-[var(--brand-red-hover)] transition-colors"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-center justify-end gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span aria-hidden>{sortDir === "asc" ? " ↑" : " ↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSortedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין תוצאות"}
                </td>
              </tr>
            ) : (
              filteredSortedRows.map((d, i) => (
                <tr key={d.id ?? i} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
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
