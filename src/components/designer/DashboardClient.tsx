"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  {
    key: "commission",
    label: "עמלה",
    sortValue: (row) => Number(row.commission) || 0,
    getValue: (row) =>
      row.commission != null && Number.isFinite(row.commission) ? String(row.commission) : "",
  },
];

function StatIconPaid({ className }: { className?: string }) {
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

function StatIconPending({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatIconDeals({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h10M4 17h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="15" y="9" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

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
  } = useSortAndFilter(deals, DASHBOARD_DEAL_COLUMNS, {
    searchPlaceholder: "",
    initialSort: { key: "invoice_date", dir: "desc" },
  });

  const columnCount = DASHBOARD_DEAL_COLUMNS.length;

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
        setDeals(Array.isArray(list) ? list.slice(0, 5) : []);
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
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200" />
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
              <div
                key={a.id}
                className="p-4 rounded-xl bg-white border border-gray-200 transition-shadow hover:shadow-[var(--shadow-card)]"
                style={{ boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-card)" }}
              >
                <h3 className="font-medium text-gray-900">{a.title}</h3>
                {a.content && <p className="text-sm text-gray-600 mt-1">{a.content}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">אין עדכונים</p>
        )}
      </section>

      {/* RTL: first item is visually on the right — עסקאות החודש rightmost */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          title="עסקאות החודש"
          value={`${dealsThisMonthCount} (${formatCurrency(dealsThisMonthTotal)})`}
          icon={<StatIconDeals className="text-[var(--brand-red)]" />}
          iconClassName="bg-[var(--brand-red)]/10 ring-1 ring-[var(--brand-red)]/15"
        />
        <StatCard
          title="עמלות שטרם שולמו"
          value={formatCurrency(pendingCommission)}
          icon={<StatIconPending className="text-amber-700" />}
          iconClassName="bg-amber-50 ring-1 ring-amber-200/80"
        />
        <StatCard
          title='סה״כ עמלות ששולמו'
          value={formatCurrency(totalEarned)}
          icon={<StatIconPaid className="text-emerald-700" />}
          iconClassName="bg-emerald-50 ring-1 ring-emerald-200/80"
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
        <div
          className="overflow-x-auto rounded-lg border border-gray-200 bg-white"
          style={{ boxShadow: "var(--shadow-card)" }}
          dir="rtl"
        >
          <table className="w-full text-sm border-collapse text-right">
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
                    className={`py-2.5 px-3 text-right cursor-pointer select-none hover:bg-[var(--brand-red-hover)] transition-colors whitespace-nowrap ${col.key === "phone" ? "min-w-[8rem]" : ""}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="mr-1" aria-hidden>
                        {sortDir === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDeals.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="text-right py-6 text-gray-500">
                    אין תוצאות
                  </td>
                </tr>
              ) : (
                sortedDeals.map((d, i) => (
                  <tr key={d.id ?? i} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-right align-top">{d.invoice_date ? formatDate(d.invoice_date) : "—"}</td>
                    <td className="py-2.5 px-3 text-right align-top">{d.customer_name ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right align-top min-w-[8rem]" dir="ltr">
                      {d.phone ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right align-top">{d.seller_name ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right align-top tabular-nums">
                      {d.amount_excl_vat != null ? formatCurrency(d.amount_excl_vat) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right align-top tabular-nums">
                      {d.commission != null ? formatCurrency(d.commission) : "—"}
                    </td>
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

function StatCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-md"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <div
        className="pointer-events-none absolute -start-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-gray-100/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1.5 text-lg font-bold leading-tight text-gray-900 tabular-nums">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
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
