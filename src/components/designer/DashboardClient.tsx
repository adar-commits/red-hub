"use client";

import { useEffect, useMemo, useState } from "react";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

interface DealRow {
  id?: string;
  invoice_date?: string;
  customer_name?: string;
  phone?: string;
  amount_excl_vat?: number;
  commission?: number;
  status?: string;
  seller_name?: string;
}

const DASHBOARD_DEAL_COLUMNS: SortFilterColumn<DealRow>[] = [
  { key: "invoice_date", label: "תאריך החשבונית" },
  { key: "customer_name", label: "שם לקוח" },
  { key: "phone", label: "טלפון" },
  { key: "seller_name", label: "מוכרן" },
  { key: "amount_excl_vat", label: "סכום ללא מע״מ" },
];

export function DashboardClient({ designerCode }: { designerCode: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [dealsThisMonthCount, setDealsThisMonthCount] = useState(0);
  const [dealsThisMonthTotal, setDealsThisMonthTotal] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingCommission, setPendingCommission] = useState(0);
  const [loading, setLoading] = useState(true);

  const {
    filteredSortedRows: sortedDeals,
    sortKey,
    sortDir,
    toggleSort,
    exportCsv,
  } = useSortAndFilter(deals, DASHBOARD_DEAL_COLUMNS, { searchPlaceholder: "" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, annRes] = await Promise.all([
          fetch("/api/dashboard-stats"),
          fetch("/api/announcements"),
        ]);
        if (cancelled) return;
        const statsData = await statsRes.json();
        const annData = await annRes.json();

        const list = statsData?.deals ?? [];
        setDeals(Array.isArray(list) ? list.slice(0, 20) : []);
        setDealsThisMonthCount(Number(statsData?.dealsThisMonthCount) || 0);
        setDealsThisMonthTotal(Number(statsData?.dealsThisMonthTotal) || 0);
        setAnnouncements(Array.isArray(annData) ? annData : []);

        const commissionsRaw = typeof window !== "undefined" ? sessionStorage.getItem("commissions") : null;
        const commissions = commissionsRaw
          ? (JSON.parse(commissionsRaw) as Array<{ commission?: number; status?: string; recon_date?: string | null }>)
          : [];
        const normalizedStatus = (s: string | null | undefined) => (s ?? "").trim();
        const isReceived = (c: { status?: string; recon_date?: string | null }) => {
          const st = normalizedStatus(c.status);
          return st === "סופית" || st === "שולמה" || (c.recon_date != null && c.recon_date !== "" && st !== "מבוטלת");
        };
        const totalE = commissions
          .filter(isReceived)
          .reduce((sum, c) => sum + (Number(c.commission) || 0), 0);
        const pending = commissions
          .filter((c) => !isReceived(c))
          .reduce((sum, c) => sum + (Number(c.commission) || 0), 0);
        setTotalEarned(totalE);
        setPendingCommission(pending);
      } catch {
        if (!cancelled) {
          setDeals([]);
          setDealsThisMonthCount(0);
          setDealsThisMonthTotal(0);
          setAnnouncements([]);
          setTotalEarned(0);
          setPendingCommission(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="animate-in-fade-up">
        <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-3">עדכונים אחרונים</h2>
        {(announcements ?? []).length > 0 ? (
          <div className="space-y-3">
            {(announcements ?? []).map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-white border border-gray-200 transition-shadow hover:shadow-[var(--shadow-card)]" style={{ boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-card)" }}>
                <h3 className="font-medium text-gray-900">{a.title}</h3>
                {a.content && <p className="text-sm text-gray-600 mt-1">{a.content}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">אין עדכונים</p>
        )}
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard title="סה״כ עמלות שהתקבלו" value={formatCurrency(totalEarned)} />
        <StatCard title="עמלות שטרם שולמו" value={formatCurrency(pendingCommission)} />
        <StatCard
          title="עסקאות החודש"
          value={`${dealsThisMonthCount} (${formatCurrency(dealsThisMonthTotal)})`}
        />
      </div>

      <section className="animate-in-fade-up">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-[var(--brand-red)]">סופקו לאחרונה</h2>
          <button
            type="button"
            onClick={() => exportCsv("dashboard-deals.csv")}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/20"
          >
            ייצוא CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" style={{ boxShadow: "var(--shadow-card)" }} dir="rtl">
          <table className="w-full text-sm border-collapse">
            <colgroup>
              {DASHBOARD_DEAL_COLUMNS.map((col) => (
                <col key={String(col.key)} style={col.key === "phone" ? { minWidth: "8rem" } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-[var(--brand-red)] text-white">
                {DASHBOARD_DEAL_COLUMNS.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`py-2.5 px-3 text-end cursor-pointer select-none hover:bg-[var(--brand-red-hover)] transition-colors whitespace-nowrap ${col.key === "phone" ? "min-w-[8rem]" : ""}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="mr-1" aria-hidden>{sortDir === "asc" ? " ↑" : " ↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    אין תוצאות
                  </td>
                </tr>
              ) : (
                sortedDeals.map((d, i) => (
                  <tr key={d.id ?? i} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-end align-top">{d.invoice_date ? formatDate(d.invoice_date) : "—"}</td>
                    <td className="py-2.5 px-3 text-end align-top">{d.customer_name ?? "—"}</td>
                    <td className="py-2.5 px-3 text-end align-top min-w-[8rem]" dir="ltr">{d.phone ?? "—"}</td>
                    <td className="py-2.5 px-3 text-end align-top">{d.seller_name ?? "—"}</td>
                    <td className="py-2.5 px-3 text-end align-top">{d.amount_excl_vat != null ? formatCurrency(d.amount_excl_vat) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div
      className="p-4 rounded-xl bg-white border border-gray-200 transition-shadow hover:shadow-[var(--shadow-card)]"
      style={{ boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-card)" }}
    >
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);
}

function formatDate(s: string): string {
  try {
    const d = new Date(s);
    return d.toLocaleDateString("he-IL");
  } catch {
    return s;
  }
}
