"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DesignerActivityType } from "@/lib/designer-activity-types";
import { DESIGNER_ACTIVITY_TYPES } from "@/lib/designer-activity-types";

type RangeKey = "yesterday" | "today" | "week" | "month" | "year" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "yesterday", label: "אתמול" },
  { key: "today", label: "היום" },
  { key: "week", label: "השבוע" },
  { key: "month", label: "החודש" },
  { key: "year", label: "השנה" },
  { key: "custom", label: "מותאם" },
];

const ACTIVITY_LABELS: Record<DesignerActivityType, string> = {
  login: "התחברות למערכת",
  invoice_upload: "העלאת חשבונית",
  business_update: "עדכון פרטי עסק",
  commission_assignment_request:
    "\u05D1\u05E7\u05E9\u05EA \u05E9\u05D9\u05D5\u05DA \u05E2\u05DE\u05DC\u05D4",
};

const TYPE_FILTER_OPTIONS: { value: "" | DesignerActivityType; label: string }[] = [
  { value: "", label: "כל הפעילויות" },
  ...DESIGNER_ACTIVITY_TYPES.map((t) => ({ value: t, label: ACTIVITY_LABELS[t] })),
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

type ActivityRow = {
  id: string;
  created_at: string;
  activity_type: DesignerActivityType;
  designer_code: string;
  agent_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
};

export function ActivityLogClient() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activityFilter, setActivityFilter] = useState<"" | DesignerActivityType>("");
  const [designerCodeFilter, setDesignerCodeFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const { from, to } = useMemo(
    () => getRangeDates(rangeKey, customFrom || undefined, customTo || undefined),
    [rangeKey, customFrom, customTo]
  );

  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("from", from.toISOString());
      params.set("to", to.toISOString());
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (activityFilter) params.set("activity_type", activityFilter);
      if (designerCodeFilter.trim()) params.set("designer_code", designerCodeFilter.trim());
      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "טעינה נכשלה");
        setRows([]);
        setTotal(0);
        setNextOffset(null);
        return;
      }
      setRows(Array.isArray(json.rows) ? json.rows : []);
      setTotal(typeof json.total === "number" ? json.total : 0);
      setNextOffset(typeof json.nextOffset === "number" ? json.nextOffset : null);
    } catch {
      setError("שגיאת רשת");
      setRows([]);
      setTotal(0);
      setNextOffset(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, offset, activityFilter, designerCodeFilter, limit, refreshNonce]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffset(0);
  }, [rangeKey, customFrom, customTo, activityFilter, designerCodeFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">סינון</h2>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRangeKey(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                rangeKey === opt.key
                  ? "bg-[var(--brand-red)] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {opt.key === "custom" ? "\uD83D\uDCC5 " : null}
              {opt.label}
            </button>
          ))}
        </div>
        {rangeKey === "custom" && (
          <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <span className="text-sm font-medium text-gray-700 block mb-3">טווח תאריכים</span>
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-700 flex items-center gap-2">
            <span>סוג פעילות</span>
            <select
              value={activityFilter}
              onChange={(e) =>
                setActivityFilter(e.target.value as "" | DesignerActivityType)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              {TYPE_FILTER_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-700 flex items-center gap-2">
            <span>קוד סוכן</span>
            <input
              type="text"
              value={designerCodeFilter}
              onChange={(e) => setDesignerCodeFilter(e.target.value)}
              placeholder="התחלה…"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-40"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setRefreshNonce((n) => n + 1);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-900"
          >
            רענון
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <h3 className="text-lg font-semibold text-[var(--brand-red)] p-4 border-b border-gray-100">
          יומן פעילות ({total})
        </h3>
        <div className="overflow-x-auto" dir="rtl">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[22%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2.5 align-middle text-end font-medium">
                  {"\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05E9\u05E2\u05D4"}
                </th>
                <th className="px-3 py-2.5 align-middle text-end font-medium">קוד סוכן</th>
                <th className="px-3 py-2.5 align-middle text-end font-medium">טלפון</th>
                <th className="px-3 py-2.5 align-middle text-end font-medium">שם סוכן</th>
                <th className="px-3 py-2.5 align-middle text-end font-medium">פעילות</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    טוען…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    אין נתונים בטווח הנבחר
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-3 py-2.5 align-middle text-end tabular-nums">
                      <span dir="ltr" className="inline-block w-full text-end">
                        {formatDateTime(row.created_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-end break-all">{row.designer_code}</td>
                    <td className="px-3 py-2.5 align-middle text-end">
                      <span dir="ltr" className="inline-block w-full text-end">
                        {row.phone ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-end">{row.agent_name ?? "—"}</td>
                    <td className="px-3 py-2.5 align-middle text-end">
                      {ACTIVITY_LABELS[row.activity_type] ?? row.activity_type}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-100">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 disabled:opacity-40"
            >
              הקודם
            </button>
            <span className="text-sm text-gray-600">
              {offset + 1}–{offset + rows.length} {"\u05DE\u05EA\u05D5\u05DA"} {total}
            </span>
            <button
              type="button"
              disabled={nextOffset == null}
              onClick={() => nextOffset != null && setOffset(nextOffset)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 disabled:opacity-40"
            >
              הבא
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
