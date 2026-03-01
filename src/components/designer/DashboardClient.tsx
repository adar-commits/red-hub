"use client";

import { useEffect, useState } from "react";

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

export function DashboardClient({ designerCode }: { designerCode: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);

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
        setStats(statsData.error ? null : statsData);
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

  const s = stats ?? { totalEarned: 0, pendingCommission: 0, dealsThisMonth: 0, lastPayment: null, openReferrals: 0 };

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

      <section>
        <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-3">עדכונים אחרונים</h2>
        {announcements && announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                <h3 className="font-medium text-gray-900">{a.title}</h3>
                {a.content && <p className="text-sm text-gray-600 mt-1">{a.content}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">אין עדכונים</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-3">סופקו לאחרונה</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--brand-red)] text-white">
                <th className="text-right py-2 px-3">תאריך החשבונית</th>
                <th className="text-right py-2 px-3">שם לקוח</th>
                <th className="text-right py-2 px-3">טלפון</th>
                <th className="text-right py-2 px-3">סכום ללא מע״מ</th>
                <th className="text-right py-2 px-3">עמלה</th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    אין תוצאות
                  </td>
                </tr>
              ) : (
                deals.map((d, i) => (
                  <tr key={d.id ?? i} className="border-t border-gray-100">
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
    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="font-semibold text-gray-900">{value}</p>
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
