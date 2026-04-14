"use client";

import { useEffect, useState, useRef } from "react";
import { ReferralModal } from "./ReferralModal";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";

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
  { key: "id", label: "חשבונית" },
];

function columnHeaderClass(key: keyof DealRow | string): string {
  switch (key) {
    case "customer_name":
      return "min-w-0 max-w-[min(16rem,55vw)]";
    default:
      return "w-max whitespace-nowrap";
  }
}

function columnCellClass(key: keyof DealRow | string): string {
  switch (key) {
    case "customer_name":
      return "min-w-0 max-w-[min(16rem,55vw)]";
    default:
      return "w-max whitespace-nowrap";
  }
}

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

      <header className="mb-4 flex items-center gap-2 sm:gap-3" dir="rtl">
        <h1 className="min-w-0 flex-1 text-start text-xl font-bold text-[var(--brand-red)] sm:text-2xl">
          העסקאות שלי
        </h1>
        <ExportCsvButton onClick={() => exportCsv("deals.csv")} label="ייצוא CSV" />
      </header>
      <p className="mb-4 text-sm text-gray-600 text-start">
        במסך זה יוצגו כל ההזמנות המשויכות אליך, לאחר 14 יום הם ישוכיו אוטומטית לתעודת עמלה.
      </p>

      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={searchPlaceholder}
        dir="rtl"
        searchInputClassName="max-sm:max-w-[10rem] max-sm:flex-[0_1_auto] sm:max-w-none"
        afterSearch={
          <button
            type="button"
            onClick={() => setReferralOpen(true)}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-red)] px-2.5 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 sm:min-h-10 sm:px-4 sm:py-2 sm:text-sm"
          >
            הוספת עסקה חדשה
          </button>
        }
      />

      {/* Mobile: edge-to-edge scroll; min-width table avoids squashed columns / per-letter wrapping */}
      <div
        className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-gutter:stable] sm:mx-0 sm:px-0 sm:pb-0"
        dir="rtl"
      >
        <div
          className="inline-block min-w-full rounded-lg border border-gray-300 bg-white text-start align-top text-gray-950"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <table
            dir="rtl"
            className="w-max min-w-full border-collapse text-start text-sm text-gray-950"
          >
            <thead>
              <tr className="bg-[var(--brand-red)] text-white">
                {DEAL_COLUMNS.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`cursor-pointer select-none px-3 py-3 text-start align-middle text-sm font-semibold transition-colors hover:bg-[var(--brand-red-hover)] ${columnHeaderClass(col.key)} ${col.key === "customer_name" ? "whitespace-normal leading-snug" : "whitespace-nowrap"}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span
                      className={`inline-flex items-center gap-1 ${col.key === "customer_name" ? "whitespace-normal" : "whitespace-nowrap"}`}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="shrink-0 tabular-nums" aria-hidden>
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-start text-base text-gray-800">
                    {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין תוצאות"}
                  </td>
                </tr>
              ) : (
                filteredSortedRows.map((d, i) => (
                  <tr key={d.id ?? i} className="border-t border-gray-200 transition-colors hover:bg-gray-50/90">
                    <td
                      className={`whitespace-nowrap px-3 py-2.5 text-start align-middle tabular-nums text-gray-950 ${columnCellClass("invoice_date")}`}
                    >
                      {d.invoice_date ? new Date(d.invoice_date).toLocaleDateString("he-IL") : "—"}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-start align-middle break-words text-gray-950 leading-snug ${columnCellClass("customer_name")}`}
                    >
                      {d.customer_name ?? "—"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2.5 text-start align-middle tabular-nums text-gray-950 ${columnCellClass("phone")}`}
                    >
                      <span className="block" dir="ltr">
                        {d.phone ?? "—"}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2.5 text-start align-middle tabular-nums text-gray-950 ${columnCellClass("amount_excl_vat")}`}
                    >
                      {d.amount_excl_vat != null
                        ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(d.amount_excl_vat)
                        : "—"}
                    </td>
                    <td
                      className={`break-all px-3 py-2.5 text-start align-middle font-mono text-sm text-gray-950 ${columnCellClass("id")}`}
                    >
                      {d.id ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReferralModal
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        designerCode={designerCode}
        onSuccess={(message) => {
          if (referralSuccessTimeoutRef.current) clearTimeout(referralSuccessTimeoutRef.current);
          const text = message?.trim()
            ? message.trim()
            : "הבקשה נשלחה בהצלחה.";
          setReferralSuccess(text);
          referralSuccessTimeoutRef.current = setTimeout(() => {
            setReferralSuccess(null);
            referralSuccessTimeoutRef.current = null;
          }, 8000);
        }}
      />
    </div>
  );
}
