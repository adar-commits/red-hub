"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";

/** Line item (COMITEMS) for a commission certificate */
export interface ComItemRow {
  ITEMCODE?: string | null;
  ITEMDES?: string | null;
  QTY?: number | null;
  PRICE?: number | null;
  TOTPRICE?: number | null;
  IVPRICE?: number | null;
  COMMISSION?: number | null;
  [key: string]: unknown;
}

interface CertRow {
  id?: string;
  comnum?: string;
  date?: string;
  updated_at?: string;
  customer?: string;
  amount?: number;
  commission?: number;
  invoice_code?: string;
  recon_date?: string | null;
  status?: string;
  comitems?: ComItemRow[];
}

interface CommissionStats {
  pendingApproval: number;
  unpaid: number;
  unpaidTotal: number;
  paid: number;
  paidTotal: number;
}

/** Status explanations for the modal — you can edit this text */
const COMMISSION_STATUS_EXPLANATIONS: Record<string, string> = {
  "חדשה/בבדיקה": "נוצרה לאחרונה וטרם הספקנו לאמת אותה",
  "נשלחה לאישור": "תעודת העמלה נשלחה לאדריכל/ית לאישורו הסופי",
  "חשבונית חסרה": "התעודה אושרה ע״י שני הצדדים וכעת ממתינה לחשבונית בכדי להתקדם לביצוע תשלום",
  "ממתין לתשלום": "ממתינה לביצוע העברת תשלום",
  "שולמה": "הועבר תשלום על תעודה זו.",
  סופית: "הועבר תשלום על תעודה זו.",
  מבוטלת: "תעודה בוטלה ידנית ע״י מנהל/ת קשרי אדריכלים ומעצבים",
};

type CertRowWithCount = CertRow & { comitems_count?: number };
const CERT_COLUMNS: SortFilterColumn<CertRowWithCount>[] = [
  { key: "date", label: "תאריך הפקה" },
  { key: "comnum", label: "מספר תעודה" },
  { key: "amount", label: "סכום" },
  { key: "commission", label: "עמלה" },
  { key: "comitems_count", label: "עסקאות" },
  { key: "status", label: "סטטוס" },
];

function formatCertCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);
}

function formatCertDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("he-IL");
  } catch {
    return String(s);
  }
}

export function CommissionsClient({ designerCode }: { designerCode: string }) {
  const [stats, setStats] = useState<CommissionStats>({
    pendingApproval: 0,
    unpaid: 0,
    unpaidTotal: 0,
    paid: 0,
    paidTotal: 0,
  });
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);


  useEffect(() => {
    const raw = sessionStorage.getItem("commissions");
    const parsed: CertRow[] = raw ? (JSON.parse(raw) as CertRow[]) : [];
    setCerts(parsed);

    const סופית = "סופית";
    const מבוטלת = "מבוטלת";
    const ממתין_לתשלום = "ממתין לתשלום";
    const pendingApproval = parsed.filter(
      (c) => (c.status ?? "").trim() !== סופית && (c.status ?? "").trim() !== מבוטלת
    ).length;
    const unpaidList = parsed.filter((c) => (c.status ?? "").trim() === ממתין_לתשלום);
    const paidList = parsed.filter((c) => (c.status ?? "").trim() === סופית);
    const unpaidTotal = unpaidList.reduce((s, c) => s + (Number(c.commission) ?? 0), 0);
    const paidTotal = paidList.reduce((s, c) => s + (Number(c.commission) ?? 0), 0);
    setStats({
      pendingApproval,
      unpaid: unpaidList.length,
      unpaidTotal,
      paid: paidList.length,
      paidTotal,
    });

    setLoading(false);
  }, []);

  const certsWithCount = useMemo(
    () =>
      certs.map((c) => {
        const items = c.comitems ?? [];
        const amountSum = items.length
          ? items.reduce((s, i) => s + (Number((i as ComItemRow).IVPRICE ?? (i as ComItemRow).TOTPRICE) || 0), 0)
          : (c.amount ?? 0);
        const commissionSum = items.length
          ? items.reduce((s, i) => s + (Number((i as ComItemRow).COMMISSION) || 0), 0)
          : (c.commission ?? 0);
        return {
          ...c,
          comnum: c.comnum ?? c.id,
          comitems_count: items.length,
          amount: amountSum,
          commission: commissionSum,
        };
      }),
    [certs]
  );

  const {
    searchQuery,
    setSearchQuery,
    filteredSortedRows,
    sortKey,
    sortDir,
    toggleSort,
    exportCsv,
    searchPlaceholder,
  } = useSortAndFilter(certsWithCount as CertRowWithCount[], CERT_COLUMNS, { searchPlaceholder: "חיפוש בתעודות..." });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const certId = uploadingRowId ?? undefined;
    e.target.value = "";
    if (!file) {
      setUploadingRowId(null);
      return;
    }
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (certId) form.append("certId", certId);
      const res = await fetch("/api/commissions/upload-invoice", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      const returnedCertId = data.certId as string | undefined;
      const invoiceCode = data.invoice_code ?? data.id;
      if (returnedCertId != null && returnedCertId !== "" && invoiceCode) {
        setCerts((prev) => {
          const next = prev.map((c) => {
            const key = c.id ?? c.comnum ?? "";
            if (key === "" || String(key) !== String(returnedCertId)) return c;
            return { ...c, invoice_code: invoiceCode };
          });
          try {
            sessionStorage.setItem("commissions", JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setUploadingRowId(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" style={{ borderRadius: "var(--radius-card)" }} />
          ))}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleUpload}
      />
      {uploadError && (
        <p className="text-red-600 text-sm mb-4" role="alert">
          {uploadError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div
          className="p-4 rounded-xl bg-red-600 text-white transition-shadow hover:shadow-[var(--shadow-card)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <p className="text-sm opacity-90">עמלות הממתינות לאישור</p>
          <p className="text-2xl font-bold">{stats.pendingApproval}</p>
        </div>
        <div
          className="p-4 rounded-xl bg-teal-700 text-white transition-shadow hover:shadow-[var(--shadow-card)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <p className="text-sm opacity-90">עמלות שטרם שולמו</p>
          <p className="text-2xl font-bold">{stats.unpaid}</p>
          <p className="text-sm opacity-90 mt-1">
            {formatCertCurrency(stats.unpaidTotal)} · {stats.unpaid} תעודות
          </p>
        </div>
        <div
          className="p-4 rounded-xl bg-green-600 text-white transition-shadow hover:shadow-[var(--shadow-card)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <p className="text-sm opacity-90">עמלות שולמו</p>
          <p className="text-2xl font-bold">{stats.paid}</p>
          <p className="text-sm opacity-90 mt-1">
            {formatCertCurrency(stats.paidTotal)} · {stats.paid} תעודות
          </p>
        </div>
      </div>

      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCsv={() => exportCsv("commissions.csv")}
        searchPlaceholder={searchPlaceholder}
        exportLabel="ייצוא CSV"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white text-end" style={{ boxShadow: "var(--shadow-card)" }} dir="rtl">
        <table className="w-full text-sm border-collapse text-end">
          <colgroup>
            <col style={{ width: "2.5rem" }} />
            {CERT_COLUMNS.map((col) => (
              <col key={String(col.key)} />
            ))}
            <col style={{ width: "3rem" }} />
          </colgroup>
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              <th className="w-10 py-2.5 px-3 text-end" aria-label="הרחבה" />
              {CERT_COLUMNS.map((col) => (
                <th
                  key={String(col.key)}
                  className="py-2.5 px-3 text-end cursor-pointer select-none hover:bg-[var(--brand-red-hover)] transition-colors whitespace-nowrap"
                  onClick={() => col.key !== "status" && toggleSort(col.key)}
                >
                  <span className="flex items-center justify-end gap-1">
                    {col.label}
                    {col.key === "status" ? (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold cursor-help"
                        title={Object.entries(COMMISSION_STATUS_EXPLANATIONS).map(([k, v]) => `${k}: ${v}`).join("\n")}
                        aria-label="הסבר סטטוסים"
                      >
                        ?
                      </span>
                    ) : (
                      sortKey === col.key && (
                        <span aria-hidden>{sortDir === "asc" ? " ↑" : " ↓"}</span>
                      )
                    )}
                  </span>
                </th>
              ))}
              <th className="w-12 py-2.5 px-3 text-end whitespace-nowrap">העלאת חשבונית</th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין תוצאות"}
                </td>
              </tr>
            ) : (
              filteredSortedRows.map((c, i) => {
                const rowKey = c.id ?? `row-${i}`;
                const hasComitems = Array.isArray(c.comitems) && c.comitems.length > 0;
                const isExpanded = expandedIds.has(String(rowKey));
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors"
                      onClick={() => hasComitems && toggleExpand(String(rowKey))}
                      role={hasComitems ? "button" : undefined}
                      tabIndex={hasComitems ? 0 : undefined}
                      onKeyDown={(e) => hasComitems && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleExpand(String(rowKey)))}
                    >
                      <td className="py-2.5 px-3 text-end align-middle" onClick={(e) => e.stopPropagation()}>
                        {hasComitems ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(String(rowKey))}
                            className="p-1 rounded text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/40"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "סגור עסקאות" : "הצג עסקאות"}
                          >
                            <span className="inline-block transition-transform duration-[var(--motion-duration-fast)]" style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}>
                              ▶
                            </span>
                          </button>
                        ) : (
                          <span className="inline-block w-6" aria-hidden />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-end">{formatCertDate(c.date)}</td>
                      <td className="py-2.5 px-3 text-end">{c.comnum ?? c.id ?? "—"}</td>
                      <td className="py-2.5 px-3 text-end">{formatCertCurrency(c.amount)}</td>
                      <td className="py-2.5 px-3 text-end">{formatCertCurrency(c.commission)}</td>
                      <td className="py-2.5 px-3 text-end">{(c as CertRowWithCount).comitems_count ?? (c.comitems ?? []).length}</td>
                      <td className="py-2.5 px-3 text-end">{c.status ?? "—"}</td>
                      <td className="py-2.5 px-3 text-end align-middle" onClick={(e) => e.stopPropagation()}>
                        {c.invoice_code ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded text-green-600" title="חשבונית הועלתה" aria-label="חשבונית הועלתה">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
                              <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                            </svg>
                          </span>
                        ) : uploadingRowId === String(c.id ?? c.comnum ?? rowKey) ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 text-gray-400" aria-label="מעלה...">
                            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setUploadingRowId(String(c.id ?? c.comnum ?? rowKey)); fileInputRef.current?.click(); }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-gray-500 hover:bg-gray-100 hover:text-[var(--brand-red)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/40 transition-colors"
                            title="העלאת חשבונית"
                            aria-label="העלאת חשבונית"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A7.5 7.5 0 018 20.25H6.75a5.25 5.25 0 01-2.25-10.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasComitems && (
                      <tr className="border-t border-gray-100 bg-gray-50/60">
                        <td colSpan={8} className="py-3 px-4">
                          <div className="pr-6" dir="rtl">
                            <p className="text-xs font-medium text-gray-500 mb-2 text-end">עסקאות — {c.comnum ?? c.id ?? "תעודה"}</p>
                            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden bg-white border-collapse" dir="rtl">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-1.5 px-3 font-medium text-end">תאריך עסקה</th>
                                  <th className="py-1.5 px-3 font-medium text-end">שם הלקוח</th>
                                  <th className="py-1.5 px-3 font-medium text-end">סכום עסקה</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(c.comitems ?? []).map((item, j) => {
                                  const row = item as ComItemRow;
                                  const itemAmount = row.IVPRICE ?? row.TOTPRICE ?? 0;
                                  return (
                                    <tr key={j} className="border-t border-gray-100">
                                      <td className="py-1.5 px-3 text-end">{formatCertDate(c.date)}</td>
                                      <td className="py-1.5 px-3 text-end">{c.customer ?? "—"}</td>
                                      <td className="py-1.5 px-3 text-end">{formatCertCurrency(itemAmount)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </>
  );
}
