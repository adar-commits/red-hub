"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const TERMS_URL = "https://www.carpetshop.co.il/policies/terms-of-service";

const OPTIONAL_FIELDS = [
  { key: "customer_full_name", label: "שם מלא לקוח" },
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
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("יש להזין טלפון");
      return;
    }
    if (!declarationAccepted) {
      setError("יש לאשר את ההצהרה לפני שליחה");
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
          declarationAccepted,
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

  return (
    <Modal open={open} onClose={onClose} title="הפניה חדשה">
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        <p className="text-sm text-gray-700 text-right leading-relaxed">
          באפשרותך לשייך לעצמך עסקה שבוצעה שאינה מופיעה ברשימה
          <br />
          ע״י מתן מידע על העסקה והצהרת נכונות
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">טלפון הלקוח/ה *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors text-right"
            dir="ltr"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">בחר שדה נוסף (אופציונלי)</label>
          <select
            value={optionalKey}
            onChange={(e) => setOptionalKey(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors text-right"
          >
            {OPTIONAL_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">ערך</label>
          <input
            type="text"
            value={optionalValue}
            onChange={(e) => setOptionalValue(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors text-right"
          />
        </div>
        <label className="flex items-start gap-2 cursor-pointer text-right">
          <input
            type="checkbox"
            checked={declarationAccepted}
            onChange={(e) => setDeclarationAccepted(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-[var(--brand-red)] focus:ring-[var(--brand-red)]/20"
          />
          <span className="text-sm text-gray-700">
            בשליחת טופס זה אני מצהיר/ה כי המידע שציינתי מהימן וכי עסקה זו הגיעה דרכי.{" "}
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-red)] underline hover:no-underline">
              תקנון תנאי שימוש
            </a>
          </span>
        </label>
        {error && <p className="text-red-600 text-sm text-right">{error}</p>}
        <div className="flex gap-2 pt-1 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/20 transition-colors"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[var(--brand-red)] text-white font-medium hover:bg-[var(--brand-red-hover)] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 transition-colors active:scale-[0.99]"
          >
            {loading ? "שולח..." : "שליחה"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
