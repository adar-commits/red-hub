"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { StatCard } from "@/components/ui/StatCard";

/** Line item (COMITEMS) for a commission certificate */
export interface ComItemRow {
  ITEMCODE?: string | null;
  ITEMDES?: string | null;
  QTY?: number | null;
  PRICE?: number | null;
  TOTPRICE?: number | null;
  IVPRICE?: number | null;
  COMMISSION?: number | null;
  /** Customer name on invoice line (ERP) */
  CDES?: string | null;
  CUSTDES?: string | null;
  IVDATE?: string | null;
  CURDATE?: string | null;
  [key: string]: unknown;
}

function comItemStringField(row: ComItemRow, ...keys: string[]): string | undefined {
  const raw = row as Record<string, unknown>;
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    const found = Object.keys(raw).find((rk) => rk.toUpperCase() === k.toUpperCase());
    if (found) {
      const u = raw[found];
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  }
  return undefined;
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
  pendingApprovalTotal: number;
  unpaid: number;
  unpaidTotal: number;
  paid: number;
  paidTotal: number;
}

function StatIconApproval({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 12h6M9 16h4M7 4h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatIconUnpaid({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatIconPaidCert({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STATUS_SENT_FOR_APPROVAL = "נשלחה לאישור";
const VAT_FACTOR = 1.18;
const MIN_INVOICE_UPLOAD_ACCRUAL_ILS = 500;
const UPLOAD_INVOICE_DISABLED_TOOLTIP =
  "ניתן להעלות חשבונית רק כאשר יתרה גדולה מ-500 ש״ח";

const COMMISSION_STATUS_TABLE_DISPLAY: Record<string, string> = {
  [STATUS_SENT_FOR_APPROVAL]: "עמלה בצבירה",
};

function displayCommissionStatus(status: string | null | undefined): string {
  const t = (status ?? "").trim();
  if (!t) return "—";
  return COMMISSION_STATUS_TABLE_DISPLAY[t] ?? t;
}

/** Status explanations for the ? tooltip (keys are raw ERP statuses). */
const COMMISSION_STATUS_EXPLANATIONS: Record<string, string> = {
  "חדשה/בבדיקה": "נוצרה לאחרונה וטרם הספקנו לאמת אותה",
  [STATUS_SENT_FOR_APPROVAL]: "תעודת העמלה נשלחה לאדריכל/ית לאישורו הסופי",
  "חשבונית חסרה": "התעודה אושרה ע״י שני הצדדים וכעת ממתינה לחשבונית בכדי להתקדם לביצוע תשלום",
  "ממתין לתשלום": "ממתינה לביצוע העברת תשלום",
  "שולמה": "הועבר תשלום על תעודה זו.",
  סופית: "הועבר תשלום על תעודה זו.",
  מבוטלת: "תעודה בוטלה ידנית ע״י מנהל/ת קשרי אדריכלים ומעצבים",
};

const COMMISSION_STATUS_HELP_TITLE = Object.entries(COMMISSION_STATUS_EXPLANATIONS)
  .map(([k, v]) => `${COMMISSION_STATUS_TABLE_DISPLAY[k] ?? k}: ${v}`)
  .join("\n");

type CertRowWithCount = CertRow & { comitems_count?: number };
const CERT_COLUMNS: SortFilterColumn<CertRowWithCount>[] = [
  {
    key: "date",
    label: "נוצרה בתאריך",
    sortValue: (row) => {
      const d = row.date;
      if (!d) return 0;
      const t = Date.parse(String(d));
      return Number.isFinite(t) ? t : 0;
    },
  },
  { key: "comnum", label: "מס׳ תעודה" },
  {
    key: "comitems_count",
    label: "כמות עסקאות",
    sortValue: (row) => Number(row.comitems_count) || 0,
    getValue: (row) =>
      String((row as CertRowWithCount).comitems_count ?? (row.comitems ?? []).length),
  },
  {
    key: "commission",
    label: "עמלה",
    sortValue: (row) => Number(row.commission) || 0,
    getValue: (row) =>
      row.commission != null && Number.isFinite(row.commission) ? String(row.commission) : "",
  },
  {
    key: "status",
    label: "סטטוס",
    getValue: (row) => displayCommissionStatus(row.status),
  },
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

function commissionHeaderClass(key: string): string {
  const base =
    "px-3 py-2.5 text-right align-bottom select-none whitespace-nowrap hover:bg-[var(--brand-red-hover)] transition-colors";
  const cursor = key === "status" ? "cursor-default" : "cursor-pointer";
  return `${base} ${cursor}`;
}

function commissionCellClass(key: string): string {
  const base = "px-3 py-2.5 text-right align-top";
  switch (key) {
    case "date":
    case "commission":
    case "comitems_count":
      return `${base} tabular-nums`;
    case "comnum":
    case "status":
      return `${base} break-words`;
    default:
      return base;
  }
}

export function CommissionsClient({ designerCode }: { designerCode: string }) {
  const [stats, setStats] = useState<CommissionStats>({
    pendingApproval: 0,
    pendingApprovalTotal: 0,
    unpaid: 0,
    unpaidTotal: 0,
    paid: 0,
    paidTotal: 0,
  });
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [modalSelectedFile, setModalSelectedFile] = useState<File | null>(null);
  const [modalUploading, setModalUploading] = useState(false);
  const [modalProgress, setModalProgress] = useState<number | null>(null);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const modalSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(
    () => () => {
      if (modalSuccessTimeoutRef.current) clearTimeout(modalSuccessTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (!uploadModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !modalUploading) setUploadModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uploadModalOpen, modalUploading]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);


  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let rows: CertRow[] = [];

      try {
        const res = await fetch("/api/commissions/certificates", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (res.ok) {
          const data: unknown = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            rows = data as CertRow[];
          }
        }
      } catch {
        /* use session fallback */
      }

      if (rows.length === 0 && typeof window !== "undefined") {
        const raw = sessionStorage.getItem("commissions");
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as CertRow[];
            if (Array.isArray(parsed)) rows = parsed;
          } catch {
            /* ignore corrupt sessionStorage */
          }
        }
      } else if (rows.length > 0 && typeof window !== "undefined") {
        sessionStorage.setItem("commissions", JSON.stringify(rows));
      }

      if (cancelled) return;

      setCerts(rows);

      const ממתין_לתשלום = "ממתין לתשלום";
      const normalizedStatus = (s: string | null | undefined) => (s ?? "").trim();
      /** Matches ERP STATDES (e.g. שולמה, סופית) and recon — same rules as DashboardClient total earned */
      const isPaidCommission = (c: CertRow) => {
        const st = normalizedStatus(c.status);
        return (
          st === "סופית" ||
          st === "שולמה" ||
          (c.recon_date != null && c.recon_date !== "" && st !== "מבוטלת")
        );
      };
      const pendingList = rows.filter((c) => normalizedStatus(c.status) === STATUS_SENT_FOR_APPROVAL);
      const pendingApproval = pendingList.length;
      const pendingApprovalTotal = pendingList.reduce((s, c) => s + (Number(c.commission) ?? 0), 0);
      const unpaidList = rows.filter((c) => normalizedStatus(c.status) === ממתין_לתשלום);
      const paidList = rows.filter(isPaidCommission);
      const unpaidTotal = unpaidList.reduce((s, c) => s + (Number(c.commission) ?? 0), 0);
      const paidTotal = paidList.reduce((s, c) => s + (Number(c.commission) ?? 0), 0);
      setStats({
        pendingApproval,
        pendingApprovalTotal,
        unpaid: unpaidList.length,
        unpaidTotal,
        paid: paidList.length,
        paidTotal,
      });

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
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
  } = useSortAndFilter(certsWithCount as CertRowWithCount[], CERT_COLUMNS, {
    searchPlaceholder: "חיפוש בתעודות...",
    initialSort: { key: "date", dir: "desc" },
  });

  const accrualTotalVatInclusive = useMemo(() => {
    const norm = (s: string | null | undefined) => (s ?? "").trim();
    return certsWithCount
      .filter((c) => norm(c.status) === STATUS_SENT_FOR_APPROVAL)
      .reduce((sum, c) => sum + (Number(c.commission) || 0) * VAT_FACTOR, 0);
  }, [certsWithCount]);

  const canUploadInvoice = accrualTotalVatInclusive >= MIN_INVOICE_UPLOAD_ACCRUAL_ILS;

  const PDF_ONLY_MESSAGE = "ניתן להעלות רק קבצים מסוג PDF בלבד";

  function assertPdfFile(file: File): string | null {
    const nameOk = /\.pdf$/i.test(file.name.trim());
    const typeOk = !file.type || file.type === "application/pdf";
    if (!nameOk || !typeOk) return PDF_ONLY_MESSAGE;
    return null;
  }

  function openUploadModal() {
    if (!canUploadInvoice) return;
    setModalError("");
    setModalSuccess(null);
    setModalSelectedFile(null);
    setModalProgress(null);
    setUploadModalOpen(true);
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
  }

  function closeUploadModal() {
    if (modalUploading) return;
    setUploadModalOpen(false);
    setModalSelectedFile(null);
    setModalProgress(null);
    setModalError("");
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
  }

  function onModalFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setModalSuccess(null);
    setModalError("");
    if (!file) {
      setModalSelectedFile(null);
      return;
    }
    const err = assertPdfFile(file);
    if (err) {
      setModalError(err);
      setModalSelectedFile(null);
      e.target.value = "";
      return;
    }
    setModalSelectedFile(file);
  }

  async function submitModalUpload() {
    const file = modalSelectedFile;
    if (!file) {
      setModalError("נא לבחור קובץ PDF.");
      return;
    }
    const clientPdfErr = assertPdfFile(file);
    if (clientPdfErr) {
      setModalError(clientPdfErr);
      return;
    }
    setModalError("");
    setModalSuccess(null);
    setModalUploading(true);
    setModalProgress(0);

    const form = new FormData();
    form.append("file", file);

    type UploadJson = { error?: string; certId?: string; invoice_code?: string; id?: string };

    try {
      const { ok, data } = await new Promise<{ ok: boolean; data: UploadJson }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/commissions/upload-invoice");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setModalProgress(Math.max(0, Math.min(100, Math.round((ev.loaded * 100) / ev.total))));
          }
        };
        xhr.onerror = () => reject(new Error("שגיאת רשת. נסו שוב."));
        xhr.onload = () => {
          let parsed: UploadJson = {};
          try {
            parsed = JSON.parse(xhr.responseText || "{}") as UploadJson;
          } catch {
            // ignore
          }
          resolve({ ok: xhr.status >= 200 && xhr.status < 300, data: parsed });
        };
        xhr.send(form);
      });

      if (!ok) {
        const msg =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "שגיאה בהעלאה. נסו שוב; אם הבעיה נמשכת, פנו לתמיכה.";
        throw new Error(msg);
      }

      const returnedCertId = data.certId;
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

      setModalProgress(100);
      if (modalSuccessTimeoutRef.current) clearTimeout(modalSuccessTimeoutRef.current);
      setModalSuccess("החשבונית הועלתה בהצלחה.");
      modalSuccessTimeoutRef.current = setTimeout(() => {
        setModalSuccess(null);
        modalSuccessTimeoutRef.current = null;
      }, 6000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "שגיאה בהעלאה. נסו שוב.");
      setModalProgress(null);
    } finally {
      setModalUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200" style={{ borderRadius: "var(--radius-card)" }} />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-gray-200" />
      </div>
    );
  }

  const uploadModal =
    uploadModalOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
        role="presentation"
        onClick={(e) => e.target === e.currentTarget && closeUploadModal()}
      >
        <div
          className="pointer-events-auto relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200/90 bg-white shadow-2xl shadow-slate-900/15"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-file-dialog-title"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[var(--brand-red)]"
                aria-hidden
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6M12 18V9m-3 3 3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 id="upload-file-dialog-title" className="text-lg font-bold leading-tight text-gray-900">
                העלאת קובץ
              </h2>
            </div>
            <button
              type="button"
              onClick={closeUploadModal}
              disabled={modalUploading}
              className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 disabled:opacity-40"
              aria-label="סגור"
            >
              <span className="text-2xl font-light leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border-e-4 border-[var(--brand-red)] bg-gradient-to-l from-red-50/90 to-white pe-4 ps-3 py-3">
              <h3 className="text-base font-bold text-gray-900">העלאת חשבונית לתשלום</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                ניתן להעלות חשבונית לתשלום אך ורק במידה וסכום העמלות הממתינות לתשלום הינו 500 ש״ח
              </p>
            </div>

            <input
              ref={modalFileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={onModalFilePicked}
              aria-label="בחירת קובץ PDF"
            />

            <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50/40 p-4 ring-1 ring-sky-100/80">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
                  aria-hidden
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
                  </svg>
                  PDF
                </span>
                <span className="text-sm font-semibold text-sky-950">לפני ההעלאה — ודאו:</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-sky-950/90">
                <li className="flex gap-2 text-right">
                  <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  <span>
                    הקובץ הוא <strong className="text-red-700">PDF בלבד</strong> (לא תמונה ולא Word).
                  </span>
                </li>
                <li className="flex gap-2 text-right">
                  <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  <span>בחשבונית מופיעים כל פרטי החשבון הנדרשים לתשלום.</span>
                </li>
                <li className="flex gap-2 text-right">
                  <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  <span>
                    הסכום <strong className="font-semibold text-indigo-900">תואם</strong> לסכומי העמלה ברשימת ״
                    <span className="whitespace-nowrap text-amber-800">ממתין לתשלום</span>״.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">קובץ לשליחה</p>
              <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  disabled={modalUploading}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--brand-red)]/50 bg-gradient-to-b from-red-50 to-orange-50/80 px-4 py-2.5 text-sm font-normal text-[var(--brand-red)] shadow-sm transition hover:border-[var(--brand-red)] hover:from-red-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/35 disabled:opacity-50"
                >
                  <svg className="h-5 w-5 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                  בחירת קובץ
                </button>
                {modalSelectedFile ? (
                  <div className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-100">
                    <svg className="h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4z" />
                    </svg>
                    <span className="min-w-0 truncate font-medium" title={modalSelectedFile.name}>
                      {modalSelectedFile.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex min-h-[44px] flex-1 items-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 text-sm text-gray-500">
                    לא נבחר קובץ — לחצו &quot;בחירת קובץ&quot;
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="sr-only" htmlFor="invoice-upload-submit">
                שליחת הקובץ להעלאה
              </label>
              <button
                id="invoice-upload-submit"
                type="button"
                onClick={submitModalUpload}
                disabled={modalUploading || !modalSelectedFile}
                className="w-full rounded-xl bg-gradient-to-l from-rose-800 via-[var(--brand-red)] to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                {modalUploading ? "מעלה…" : "העלאת חשבונית"}
              </button>
            </div>

            {(modalUploading || modalProgress === 100) && (
              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3" aria-hidden={!modalUploading}>
                <div className="mb-2 flex justify-between text-xs font-medium text-violet-900">
                  <span>התקדמות העלאה</span>
                  <span className="tabular-nums">{modalProgress != null ? `${modalProgress}%` : "—"}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-violet-600 via-fuchsia-500 to-[var(--brand-red)] transition-[width] duration-300 ease-out"
                    style={{ width: `${modalProgress ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {modalError ? (
              <div
                className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-right text-sm text-red-900"
                role="alert"
              >
                <span className="shrink-0 text-lg text-red-600" aria-hidden>
                  !
                </span>
                <p className="min-w-0 leading-relaxed">{modalError}</p>
              </div>
            ) : null}
            {modalSuccess ? (
              <div
                className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-right text-sm text-emerald-900"
                role="status"
              >
                <span className="shrink-0 text-lg text-emerald-600" aria-hidden>
                  ✓
                </span>
                <p className="min-w-0 font-medium leading-relaxed">{modalSuccess}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div dir="rtl" className="w-full text-right clear-both">
      {uploadModal}

      <header className="mb-4 flex items-center gap-2 sm:gap-3">
        <h1 className="min-w-0 flex-1 text-start text-xl font-bold text-[var(--brand-red)] sm:text-2xl">תעודות עמלה</h1>
        <ExportCsvButton onClick={() => exportCsv("commissions.csv")} label="ייצוא" />
      </header>
      <p className="mb-4 text-start text-sm text-gray-600">
        במסך זה יוצגו תעודות עמלה מ-12 החודשים האחרונים
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          title="עמלות בצבירה"
          value={`${stats.pendingApproval} תעודות · ${formatCertCurrency(stats.pendingApprovalTotal)}`}
          explanation={"בצבירה: העמלות שצברת עד כה. לתשלום נדרש סכום מצטבר של לפחות 500 ש״ח."}
          icon={<StatIconApproval className="text-orange-700" />}
          iconClassName="bg-orange-50 ring-1 ring-orange-200/80"
        />
        <StatCard
          title="ממתינות לתשלום"
          value={`${stats.unpaid} תעודות · ${formatCertCurrency(stats.unpaidTotal)}`}
          explanation="ממתינה לתשלום: ממתינות לתשלום - יש להעלות חשבונית במערכת."
          icon={<StatIconUnpaid className="text-amber-700" />}
          iconClassName="bg-amber-50 ring-1 ring-amber-200/80"
        />
        <StatCard
          title="עמלות שולמו"
          value={`${stats.paid} תעודות · ${formatCertCurrency(stats.paidTotal)}`}
          explanation="עמלות שולמו: עמלות ששולמו והועברו לחשבונך."
          icon={<StatIconPaidCert className="text-emerald-700" />}
          iconClassName="bg-emerald-50 ring-1 ring-emerald-200/80"
        />
      </div>

      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={searchPlaceholder}
        dir="rtl"
        afterSearch={
          <button
            type="button"
            onClick={openUploadModal}
            disabled={!canUploadInvoice}
            title={!canUploadInvoice ? UPLOAD_INVOICE_DISABLED_TOOLTIP : undefined}
            aria-disabled={!canUploadInvoice}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-400 bg-white px-2.5 py-2 text-xs font-medium text-gray-950 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:min-h-10 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-[var(--brand-red)] sm:h-5 sm:w-5"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18V9" />
              <path d="m9 12 3-3 3 3" />
            </svg>
            העלאת חשבונית
          </button>
        }
      />

      <div
        className="block w-full max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white text-right"
        style={{ boxShadow: "var(--shadow-card)" }}
        dir="rtl"
      >
        <table dir="rtl" className="w-full min-w-[min(100%,36rem)] table-fixed border-collapse text-right text-sm">
          <colgroup>
            <col className="w-10" />
            <col style={{ width: "14%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "36%" }} />
          </colgroup>
          <thead>
            <tr className="bg-[var(--brand-red)] text-white">
              <th className="w-10 min-w-10 py-2.5 px-2 text-right align-bottom" aria-label="הרחבה" />
              {CERT_COLUMNS.map((col) => (
                <th
                  key={String(col.key)}
                  className={commissionHeaderClass(String(col.key))}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (col.key !== "status") toggleSort(col.key);
                  }}
                >
                  <span className="inline-block whitespace-nowrap">
                    {col.label}
                    {col.key === "status" ? (
                      <>
                        {" "}
                        <span
                          className="inline-flex h-5 w-5 align-middle items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white cursor-help"
                          title={COMMISSION_STATUS_HELP_TITLE}
                          aria-label="הסבר סטטוסים"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ?
                        </span>
                      </>
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
                <td colSpan={6} className="py-8 text-right text-gray-500">
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
                      className={`border-t border-gray-100 transition-colors ${hasComitems ? "cursor-pointer hover:bg-gray-50/80" : ""}`}
                      onClick={() => hasComitems && toggleExpand(String(rowKey))}
                      role={hasComitems ? "button" : undefined}
                      tabIndex={hasComitems ? 0 : undefined}
                      onKeyDown={(e) =>
                        hasComitems &&
                        (e.key === "Enter" || e.key === " ") &&
                        (e.preventDefault(), toggleExpand(String(rowKey)))
                      }
                    >
                      <td className="px-2 py-2.5 text-right align-middle">
                        {hasComitems ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(String(rowKey));
                            }}
                            className="rounded p-1 text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/40"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "סגור עסקאות" : "הצג עסקאות"}
                          >
                            <span
                              className="inline-block transition-transform duration-[var(--motion-duration-fast)]"
                              style={{
                                transform: isExpanded ? "scaleX(-1) rotate(90deg)" : "scaleX(-1)",
                              }}
                            >
                              ▶
                            </span>
                          </button>
                        ) : (
                          <span className="inline-block w-6" aria-hidden />
                        )}
                      </td>
                      <td className={`${commissionCellClass("date")}`} dir="rtl">
                        {formatCertDate(c.date)}
                      </td>
                      <td className={`${commissionCellClass("comnum")}`} dir="rtl">
                        {c.comnum ?? c.id ?? "—"}
                      </td>
                      <td className={`${commissionCellClass("comitems_count")}`} dir="rtl">
                        {(c as CertRowWithCount).comitems_count ?? (c.comitems ?? []).length}
                      </td>
                      <td className={`${commissionCellClass("commission")}`} dir="rtl">
                        {formatCertCurrency(c.commission)}
                      </td>
                      <td className={`${commissionCellClass("status")}`} dir="rtl">
                        {displayCommissionStatus(c.status)}
                      </td>
                    </tr>
                    {isExpanded && hasComitems && (
                      <tr className="border-t border-gray-100 bg-gray-50/60">
                        <td colSpan={6} className="px-4 py-3 align-top">
                          <div className="me-auto ms-0 w-full max-w-4xl pe-0 ps-2 text-right" dir="rtl">
                            <p className="mb-2 text-right text-xs font-medium text-gray-600">
                              {c.comnum ?? c.id ?? "תעודה"} — עסקאות
                            </p>
                            <table
                              dir="rtl"
                              className="w-full table-fixed border-collapse overflow-hidden rounded-lg border border-gray-200 bg-white text-right text-sm"
                            >
                              <colgroup>
                                <col className="w-[26%]" />
                                <col className="w-[48%]" />
                                <col className="w-[26%]" />
                              </colgroup>
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-3 py-2 text-right align-bottom text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    תאריך עסקה
                                  </th>
                                  <th className="px-3 py-2 text-right align-bottom text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    שם הלקוח
                                  </th>
                                  <th className="px-3 py-2 text-right align-bottom text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    סכום עסקה
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(c.comitems ?? []).map((item, j) => {
                                  const row = item as ComItemRow;
                                  const itemAmount = row.IVPRICE ?? row.TOTPRICE ?? 0;
                                  const itemDateRaw =
                                    comItemStringField(row, "IVDATE", "CURDATE", "IV_DATE") ?? c.date;
                                  const customerName =
                                    comItemStringField(row, "CDES", "CUSTDES") ||
                                    (typeof c.customer === "string" && c.customer.trim()) ||
                                    comItemStringField(row, "ORDNAME") ||
                                    (typeof row.ITEMDES === "string" && row.ITEMDES.trim()) ||
                                    (typeof row.ITEMCODE === "string" && row.ITEMCODE.trim()) ||
                                    "—";
                                  return (
                                    <tr key={j} className="border-t border-gray-100">
                                      <td className="px-3 py-2 text-right align-top tabular-nums" dir="rtl">
                                        {formatCertDate(itemDateRaw)}
                                      </td>
                                      <td className="max-w-0 px-3 py-2 text-right align-top break-words" dir="rtl">
                                        {customerName}
                                      </td>
                                      <td className="px-3 py-2 text-right align-top tabular-nums" dir="rtl">
                                        {formatCertCurrency(itemAmount)}
                                      </td>
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
    </div>
  );
}
