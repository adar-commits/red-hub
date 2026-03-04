"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ReferralModal } from "./ReferralModal";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";
import { Modal } from "@/components/ui/Modal";

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

  const [statusModalOpen, setStatusModalOpen] = useState(false);

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
      certs.map((c) => ({
        ...c,
        comnum: c.comnum ?? c.id,
        comitems_count: (c.comitems ?? []).length,
      })),
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

      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="הסבר סטטוסים"
      >
        <ul className="space-y-3 text-sm text-gray-700">
          {Object.entries(COMMISSION_STATUS_EXPLANATIONS).map(([label, text]) => (
            <li key={label}>
              <strong className="text-gray-900">{label}:</strong> {text}
            </li>
          ))}
        </ul>
      </Modal>

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
                  onClick={() => col.key !== "status" && toggleSort(col.key)}
                >
                  <span className="flex items-center justify-end gap-1">
                    {col.label}
                    {col.key === "status" ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setStatusModalOpen(true); }}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold"
                        aria-label="הסבר סטטוסים"
                        title="הסבר סטטוסים"
                      >
                        ?
                      </button>
                    ) : (
                      sortKey === col.key && (
                        <span aria-hidden>{sortDir === "asc" ? " ↑" : " ↓"}</span>
                      )
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
                      <td className="py-2 px-2 align-middle text-right" onClick={(e) => e.stopPropagation()}>
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
                      <td className="py-2 px-3 text-right">{formatCertDate(c.date)}</td>
                      <td className="py-2 px-3 text-right">{c.comnum ?? c.id ?? "—"}</td>
                      <td className="py-2 px-3 text-right">{formatCertCurrency(c.amount)}</td>
                      <td className="py-2 px-3 text-right">{formatCertCurrency(c.commission)}</td>
                      <td className="py-2 px-3 text-right">{(c as CertRowWithCount).comitems_count ?? (c.comitems ?? []).length}</td>
                      <td className="py-2 px-3 text-right">{c.status ?? "—"}</td>
                    </tr>
                    {isExpanded && hasComitems && (
                      <tr className="border-t border-gray-100 bg-gray-50/60">
                        <td colSpan={7} className="py-3 px-4">
                          <div className="pr-6">
                            <p className="text-xs font-medium text-gray-500 mb-2">עסקאות — {c.comnum ?? c.id ?? "תעודה"}</p>
                            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden bg-white table-fixed">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="py-1.5 px-2 font-medium text-right">תאריך</th>
                                  <th className="py-1.5 px-2 font-medium text-right">שם הלקוח</th>
                                  <th className="py-1.5 px-2 font-medium text-right">טלפון</th>
                                  <th className="py-1.5 px-2 font-medium text-right">סכום</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(c.comitems ?? []).map((item, j) => (
                                  <tr key={j} className="border-t border-gray-100">
                                    <td className="py-1.5 px-2 text-right">{formatCertDate(c.date)}</td>
                                    <td className="py-1.5 px-2 text-right">{c.customer ?? "—"}</td>
                                    <td className="py-1.5 px-2 text-right" dir="ltr">—</td>
                                    <td className="py-1.5 px-2 text-right">{formatCertCurrency(item.TOTPRICE as number)}</td>
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
