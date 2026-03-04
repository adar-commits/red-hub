"use client";

import { useEffect, useMemo, useState } from "react";
import { useSortAndFilter, type SortFilterColumn } from "@/hooks/useSortAndFilter";

interface Stats {
  totalEarned: number;
  pendingCommission: number;
  dealsThisMonth: number;
  lastPayment: { amount: number; date: string } | null;
  openReferrals: number;
}

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
}

function searchMatch(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = q.split(/\s+/).filter(Boolean);
  const t = text.toLowerCase();
  return words.every((w) => t.includes(w));
}

const DASHBOARD_DEAL_COLUMNS: SortFilterColumn<DealRow>[] = [
  { key: "invoice_date", label: "תאריך החשבונית" },
  { key: "customer_name", label: "שם לקוח" },
  { key: "phone", label: "טלפון" },
  { key: "amount_excl_vat", label: "סכום ללא מע״מ" },
  { key: "commission", label: "עמלה" },
];

export function DashboardClient({ designerCode }: { designerCode: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements ?? [];
    return (announcements ?? []).filter(
      (a) =>
        searchMatch(a.title, searchQuery) ||
        (a.content != null && searchMatch(a.content, searchQuery))
    );
  }, [announcements, searchQuery]);

  const dealRowText = (d: DealRow) =>
    [
      d.invoice_date ?? "",
      d.customer_name ?? "",
      d.phone ?? "",
      d.amount_excl_vat ?? "",
      d.commission ?? "",
    ].join(" ");
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    return deals.filter((d) => searchMatch(dealRowText(d), searchQuery));
  }, [deals, searchQuery]);

  const {
    filteredSortedRows: sortedDeals,
    sortKey,
    sortDir,
    toggleSort,
    exportCsv,
  } = useSortAndFilter(filteredDeals, DASHBOARD_DEAL_COLUMNS, { searchPlaceholder: "" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, annRes, dealsRes] = await Promise.all([
          fetch("/api/dashboard-stats"),
          fetch("/api/announcements"),
          fetch("/api/deals"),
        ]);
        if (cancelled) return;
        const statsData = await statsRes.json();
        const annData = await annRes.json();
        const dealsData = await dealsRes.json();
        let mergedStats = statsData.error ? null : statsData;

        const commissionsRaw = typeof window !== "undefined" ? sessionStorage.getItem("commissions") : null;
        const commissions = commissionsRaw ? (JSON.parse(commissionsRaw) as Array<{ commission?: number; recon_date?: string | null }>) : [];
        const totalEarned = commissions
          .filter((c) => c.recon_date)
          .reduce((sum, c) => sum + (Number(c.commission) || 0), 0);
        const pendingCommission = commissions
          .filter((c) => !c.recon_date)
          .reduce((sum, c) => sum + (Number(c.commission) || 0), 0);

        if (mergedStats && (commissions.length > 0)) {
          mergedStats = {
            ...mergedStats,
            totalEarned: mergedStats.totalEarned ?? totalEarned,
            pendingCommission: mergedStats.pendingCommission ?? pendingCommission,
          };
        } else if (commissions.length > 0) {
          mergedStats = {
            totalEarned,
            pendingCommission,
            dealsThisMonth: 0,
            lastPayment: null,
            openReferrals: 0,
          };
        }

        setStats(mergedStats ?? { totalEarned: 0, pendingCommission: 0, dealsThisMonth: 0, lastPayment: null, openReferrals: 0 });
        setAnnouncements(Array.isArray(annData) ? annData : []);
        const list = dealsData?.deals ?? dealsData ?? [];
        setDeals(Array.isArray(list) ? list.slice(0, 5) : []);
      } catch {
        if (!cancelled) {
          setStats({ totalEarned: 0, pendingCommission: 0, dealsThisMonth: 0, lastPayment: null, openReferrals: 0 });
          setAnnouncements([]);
          setDeals([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const s = stats ?? { totalEarned: 0, pendingCommission: 0, dealsThisMonth: 0, lastPayment: null, openReferrals: 0 };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="h-48 rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="סה״כ עמלות שהתקבלו" value={formatCurrency(s.totalEarned)} />
        <StatCard title="עמלות שטרם שולמו" value={formatCurrency(s.pendingCommission)} />
        <StatCard title="עסקאות החודש" value={String(s.dealsThisMonth)} />
        <StatCard
          title="תשלום אחרון"
          value={s.lastPayment ? `${formatCurrency(s.lastPayment.amount)} (${formatDate(s.lastPayment.date)})` : "—"}
        />
        <StatCard title="הפניות פתוחות" value={String(s.openReferrals)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש בעדכונים ובעסקאות..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2 text-sm placeholder:text-gray-500 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
          aria-label="חיפוש"
        />
      </div>

      <section className="animate-in-fade-up">
        <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-3">עדכונים אחרונים</h2>
        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-3">
            {filteredAnnouncements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-white border border-gray-200 transition-shadow hover:shadow-[var(--shadow-card)]" style={{ boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-card)" }}>
                <h3 className="font-medium text-gray-900">{a.title}</h3>
                {a.content && <p className="text-sm text-gray-600 mt-1">{a.content}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין עדכונים"}
          </p>
        )}
      </section>

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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--brand-red)] text-white">
                {DASHBOARD_DEAL_COLUMNS.map((col) => (
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
              {sortedDeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    {searchQuery.trim() ? "אין תוצאות לחיפוש" : "אין תוצאות"}
                  </td>
                </tr>
              ) : (
                sortedDeals.map((d, i) => (
                  <tr key={d.id ?? i} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                    <td className="py-2 px-3">{d.invoice_date ? formatDate(d.invoice_date) : "—"}</td>
                    <td className="py-2 px-3">{d.customer_name ?? "—"}</td>
                    <td className="py-2 px-3" dir="ltr">{d.phone ?? "—"}</td>
                    <td className="py-2 px-3">{d.amount_excl_vat != null ? formatCurrency(d.amount_excl_vat) : "—"}</td>
                    <td className="py-2 px-3">{d.commission != null ? formatCurrency(d.commission) : "—"}</td>
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
