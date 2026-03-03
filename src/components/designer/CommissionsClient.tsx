"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ReferralModal } from "./ReferralModal";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";

/** Line item (COMITEMS) for a commission certificate */
export interface ComItemRow {
  ITEMCODE?: string | null;
  ITEMDES?: string | null;
  QTY?: number | null;
  PRICE?: number | null;
  TOTPRICE?: number | null;
  COMMISSION?: number | null;
  [key: string]: unknown;
}

interface CertRow {
  id?: string;
  date?: string;
  updated_at?: string;
  customer?: string;
  amount?: number;
  commission?: number;
  invoice_code?: string;
  recon_date?: string | null;
  comitems?: ComItemRow[];
}

interface CommissionStats {
  pendingApproval: number;
  unpaid: number;
  paid: number;
}

const CERT_COLUMNS: SortFilterColumn<CertRow>[] = [
  { key: "date", label: "תאריך" },
  { key: "id", label: "מספר תעודה" },
  { key: "customer", label: "לקוח" },
  { key: "amount", label: "סכום" },
  { key: "commission", label: "עמלה" },
  { key: "recon_date", label: "תאריך פירעון" },
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
  const [stats, setStats] = useState<CommissionStats>({ pendingApproval: 0, unpaid: 0, paid: 0 });
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralOpen, setReferralOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
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

    const paid = parsed.filter((c) => c.recon_date).length;
    const unpaid = parsed.filter((c) => !c.recon_date && (c.commission ?? 0) > 0).length;
    setStats({ pendingApproval: 0, unpaid, paid });

    setLoading(false);
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
  } = useSortAndFilter(certs, CERT_COLUMNS, { searchPlaceholder: "חיפוש בתעודות..." });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/commissions/upload-invoice", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setCerts((prev) => [{ ...data, date: new Date().toISOString() }, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setUploading(false);
      e.target.value = "";
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
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setReferralOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--sidebar-bg)] text-white text-sm font-medium hover:bg-[var(--sidebar-bg)]/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/20"
        >
          הפניה חדשה
        </button>
        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-[var(--brand-red)]/20 transition-colors">
          <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading ? "מעלה..." : "העלאת חשבונית"}
        </label>
      </div>
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
        </div>
        <div
          className="p-4 rounded-xl bg-green-600 text-white transition-shadow hover:shadow-[var(--shadow-card)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <p className="text-sm opacity-90">עמלות שולמו</p>
          <p className="text-2xl font-bold">{stats.paid}</p>
        </div>
      </div>

      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCsv={() => exportCsv("commissions.csv")}
        searchPlaceholder={searchPlaceholder}
        exportLabel="ייצוא CSV"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              <th className="w-10 py-2 px-2" aria-label="הרחבה" />
              {CERT_COLUMNS.map((col) => (
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
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין תוצאות"}
                </td>
              </tr>
            ) : (
              filteredSortedRows.map((c, i) => {
                const rowKey = c.id ?? `row-${i}`;
                const hasComitems = Array.isArray(c.comitems) && c.comitems.length > 0;
                const isExpanded = hasComitems && expandedIds.has(String(rowKey));
                return (
                  <React.Fragment key={rowKey}>
                    <tr className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                      <td className="py-2 px-2 align-middle">
                        {hasComitems ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(String(rowKey))}
                            className="p-1 rounded text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/40"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "סגור פריטים" : "הצג פריטים"}
                          >
                            <span className="inline-block transition-transform duration-[var(--motion-duration-fast)]" style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}>
                              ▶
                            </span>
                          </button>
                        ) : (
                          <span className="inline-block w-6" aria-hidden />
                        )}
                      </td>
                      <td className="py-2 px-3">{formatCertDate(c.date)}</td>
                      <td className="py-2 px-3">{c.id ?? "—"}</td>
                      <td className="py-2 px-3">{c.customer ?? "—"}</td>
                      <td className="py-2 px-3">{formatCertCurrency(c.amount)}</td>
                      <td className="py-2 px-3">{formatCertCurrency(c.commission)}</td>
                      <td className="py-2 px-3">{formatCertDate(c.recon_date ?? undefined)}</td>
                    </tr>
                    {isExpanded && hasComitems && (
                      <tr className="border-t border-gray-100 bg-gray-50/60">
                        <td colSpan={7} className="py-3 px-4">
                          <div className="pr-6">
                            <p className="text-xs font-medium text-gray-500 mb-2">פריטי עמלה (COMITEMS) — {c.id ?? "תעודה"}</p>
                            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <thead>
                                <tr className="bg-gray-100 text-right">
                                  <th className="py-1.5 px-2 font-medium">קוד</th>
                                  <th className="py-1.5 px-2 font-medium">תיאור</th>
                                  <th className="py-1.5 px-2 font-medium">כמות</th>
                                  <th className="py-1.5 px-2 font-medium">מחיר</th>
                                  <th className="py-1.5 px-2 font-medium">סה״כ</th>
                                  <th className="py-1.5 px-2 font-medium">עמלה</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(c.comitems ?? []).map((item, j) => (
                                  <tr key={j} className="border-t border-gray-100">
                                    <td className="py-1.5 px-2">{item.ITEMCODE ?? "—"}</td>
                                    <td className="py-1.5 px-2">{item.ITEMDES ?? "—"}</td>
                                    <td className="py-1.5 px-2">{item.QTY != null ? String(item.QTY) : "—"}</td>
                                    <td className="py-1.5 px-2">{formatCertCurrency(item.PRICE as number)}</td>
                                    <td className="py-1.5 px-2">{formatCertCurrency(item.TOTPRICE as number)}</td>
                                    <td className="py-1.5 px-2">{formatCertCurrency(item.COMMISSION as number)}</td>
                                  </tr>
                                ))}
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

      <ReferralModal open={referralOpen} onClose={() => setReferralOpen(false)} designerCode={designerCode} onSuccess={() => setReferralOpen(false)} />
    </>
  );
}
