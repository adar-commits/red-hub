"use client";

import { useEffect, useState, useRef } from "react";
import { ReferralModal } from "./ReferralModal";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";

interface DealRow {
  id?: string;
  invoice_date?: string;
  customer_name?: string;
  phone?: string;
  amount_excl_vat?: number;
  status?: string;
  branch?: string;
  seller_name?: string;
}

const DEAL_COLUMNS: SortFilterColumn<DealRow>[] = [
  { key: "invoice_date", label: "תאריך החשבונית" },
  { key: "customer_name", label: "שם לקוח" },
  { key: "phone", label: "טלפון" },
  { key: "amount_excl_vat", label: "סכום ללא מע״מ" },
  { key: "id", label: "הזמנה (IVNUM)" },
  { key: "status", label: "סטטוס" },
];

export function DealsClient({ designerCode }: { designerCode: string }) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  const referralSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (referralSuccessTimeoutRef.current) clearTimeout(referralSuccessTimeoutRef.current);
    },
    []
  );

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
    <div dir="rtl" className="w-full text-start clear-both">
      {referralSuccess && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900"
          role="status"
          aria-live="polite"
        >
          <span className="min-w-0 flex-1 text-start">{referralSuccess}</span>
          <button
            type="button"
            onClick={() => {
              if (referralSuccessTimeoutRef.current) clearTimeout(referralSuccessTimeoutRef.current);
              referralSuccessTimeoutRef.current = null;
              setReferralSuccess(null);
            }}
            className="shrink-0 rounded p-0.5 text-emerald-700 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            aria-label="סגור הודעה"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap justify-start gap-2">
        <button
          type="button"
          onClick={() => setReferralOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--sidebar-bg)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--sidebar-bg)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/20"
        >
          הוספת עסקה חדשה
        </button>
      </div>

      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCsv={() => exportCsv("deals.csv")}
        searchPlaceholder={searchPlaceholder}
        exportLabel="ייצוא CSV"
        dir="rtl"
      />

      <div
        className="w-full max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white text-start"
        style={{ boxShadow: "var(--shadow-card)" }}
        dir="rtl"
      >
        <table dir="rtl" className="w-full table-fixed border-collapse text-start text-sm">
          <colgroup>
            <col className="w-[6.75rem]" />
            <col />
            <col className="w-[8.5rem]" />
            <col className="w-[7.5rem]" />
            <col className="w-[min(11rem,24vw)]" />
            <col className="w-[6.5rem]" />
          </colgroup>
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              {DEAL_COLUMNS.map((col) => (
                <th
                  key={String(col.key)}
                  className="cursor-pointer select-none px-3 py-2.5 text-start align-bottom whitespace-nowrap transition-colors hover:bg-[var(--brand-red-hover)]"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-end justify-start gap-1">
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
                <td colSpan={6} className="py-8 text-start text-gray-500">
                  {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין תוצאות"}
                </td>
              </tr>
            ) : (
              filteredSortedRows.map((d, i) => (
                <tr key={d.id ?? i} className="border-t border-gray-100 transition-colors hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 text-start align-top tabular-nums">
                    {d.invoice_date ? new Date(d.invoice_date).toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td className="max-w-0 px-3 py-2.5 text-start align-top break-words">{d.customer_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-start align-top tabular-nums" dir="ltr">
                    {d.phone ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-start align-top tabular-nums">
                    {d.amount_excl_vat != null
                      ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(d.amount_excl_vat)
                      : "—"}
                  </td>
                  <td className="max-w-0 px-3 py-2.5 text-start align-top break-words">{d.id ?? "—"}</td>
                  <td className="px-3 py-2.5 text-start align-top">
                    <StatusBadge status={d.status} />
                  </td>
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
        onSuccess={() => {
          if (referralSuccessTimeoutRef.current) clearTimeout(referralSuccessTimeoutRef.current);
          setReferralSuccess("הבקשה נשלחה בהצלחה.");
          referralSuccessTimeoutRef.current = setTimeout(() => {
            setReferralSuccess(null);
            referralSuccessTimeoutRef.current = null;
          }, 6000);
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const style = s.includes("אושר") || s.includes("approved") ? "bg-green-100 text-green-800" : s.includes("ממתין") || s.includes("pending") ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 rounded text-xs ${style}`}>{status || "—"}</span>;
}
