"use client";

import { useState } from "react";

const OPTIONAL_FIELDS = [
  { key: "secondary_phone", label: "טלפון משני" },
  { key: "branch", label: "סניף" },
  { key: "salesperson", label: "איש מכירות" },
  { key: "amount_range", label: "טווח סכום" },
] as const;

export function ReferralModal({
  open,
  onClose,
  designerCode,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  designerCode: string;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [optionalKey, setOptionalKey] = useState<string>(OPTIONAL_FIELDS[0].key);
  const [optionalValue, setOptionalValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("יש להזין טלפון");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          optionalField: optionalKey,
          optionalValue: optionalValue.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה");
        return;
      }
      onSuccess();
      onClose();
      setPhone("");
      setOptionalValue("");
    } catch {
      setError("שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-[var(--brand-red)] mb-4">הפניה חדשה</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] outline-none"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">בחר שדה נוסף (אופציונלי)</label>
            <select
              value={optionalKey}
              onChange={(e) => setOptionalKey(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] outline-none"
            >
              {OPTIONAL_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ערך</label>
            <input
              type="text"
              value={optionalValue}
              onChange={(e) => setOptionalValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] outline-none"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-[var(--brand-red)] text-white font-medium disabled:opacity-60"
            >
              {loading ? "שולח..." : "שליחה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
