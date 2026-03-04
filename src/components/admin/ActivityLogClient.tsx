"use client";

import { useState, useMemo } from "react";

type RangeKey = "yesterday" | "today" | "week" | "month" | "year" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "yesterday", label: "אתמול" },
  { key: "today", label: "היום" },
  { key: "week", label: "השבוע" },
  { key: "month", label: "החודש" },
  { key: "year", label: "השנה" },
  { key: "custom", label: "מותאם" },
];

function getRangeDates(key: RangeKey, from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let fromDate: Date;
  let toDate: Date = new Date(today);
  toDate.setHours(23, 59, 59, 999);
  switch (key) {
    case "yesterday":
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 1);
      toDate = new Date(fromDate);
      toDate.setHours(23, 59, 59, 999);
      break;
    case "today":
      fromDate = new Date(today);
      break;
    case "week":
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case "month":
      fromDate = new Date(today);
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case "year":
      fromDate = new Date(today);
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    case "custom":
      fromDate = from ? new Date(from) : new Date(today);
      toDate = to ? new Date(to) : toDate;
      toDate.setHours(23, 59, 59, 999);
      break;
    default:
      fromDate = new Date(today);
  }
  return { from: fromDate, to: toDate };
}

function formatDateForInput(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(s: string): string {
  try {
    return new Date(s).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

interface LoginRow {
  date_time: string;
  agentcode: string;
  agentname: string;
}

interface AssignmentRow {
  date_time: string;
  agentcode: string;
  agentname: string;
  customer_name: string;
  total: number;
}

export function ActivityLogClient() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  const { from, to } = useMemo(
    () => getRangeDates(rangeKey, customFrom || undefined, customTo || undefined),
    [rangeKey, customFrom, customTo]
  );

  const [logins] = useState<LoginRow[]>(() => [
    { date_time: new Date().toISOString(), agentcode: "D001", agentname: "דוגמה מעצב" },
  ]);
  const [assignments] = useState<AssignmentRow[]>(() => [
    {
      date_time: new Date().toISOString(),
      agentcode: "D001",
      agentname: "דוגמה מעצב",
      customer_name: "לקוח דוגמה",
      total: 1500,
    },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">סקירה כללית</h2>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setRangeKey(opt.key);
                if (opt.key === "custom") setCustomOpen(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                rangeKey === opt.key
                  ? "bg-[var(--brand-red)] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {opt.key === "custom" && "📅 "}
              {opt.label}
            </button>
          ))}
        </div>
        {rangeKey === "custom" && (
          <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="סגור"
              >
                ×
              </button>
              <span className="text-sm font-medium text-gray-700">טווח תאריכים</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          טווח: {from.toLocaleDateString("he-IL")} – {to.toLocaleDateString("he-IL")}
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <h3 className="text-lg font-semibold text-[var(--brand-red)] p-4 border-b border-gray-100">
          התחברויות אחרונות (Logins)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-right">
                <th className="py-2 px-3 font-medium">תאריך ושעה</th>
                <th className="py-2 px-3 font-medium">קוד מעצב</th>
                <th className="py-2 px-3 font-medium">שם מעצב</th>
              </tr>
            </thead>
            <tbody>
              {logins.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    אין נתונים בטווח הנבחר
                  </td>
                </tr>
              ) : (
                logins.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 px-3 text-right" dir="ltr">
                      {formatDateTime(row.date_time)}
                    </td>
                    <td className="py-2 px-3 text-right">{row.agentcode}</td>
                    <td className="py-2 px-3 text-right">{row.agentname}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <h3 className="text-lg font-semibold text-[var(--brand-red)] p-4 border-b border-gray-100">
          בקשות הפניה חדשות (Assignment Request)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-right">
                <th className="py-2 px-3 font-medium">תאריך ושעה</th>
                <th className="py-2 px-3 font-medium">קוד מעצב</th>
                <th className="py-2 px-3 font-medium">שם מעצב</th>
                <th className="py-2 px-3 font-medium">שם לקוח</th>
                <th className="py-2 px-3 font-medium">סכום</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    אין נתונים בטווח הנבחר
                  </td>
                </tr>
              ) : (
                assignments.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 px-3 text-right" dir="ltr">
                      {formatDateTime(row.date_time)}
                    </td>
                    <td className="py-2 px-3 text-right">{row.agentcode}</td>
                    <td className="py-2 px-3 text-right">{row.agentname}</td>
                    <td className="py-2 px-3 text-right">{row.customer_name}</td>
                    <td className="py-2 px-3 text-right">
                      {new Intl.NumberFormat("he-IL", {
                        style: "currency",
                        currency: "ILS",
                      }).format(row.total)}
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
