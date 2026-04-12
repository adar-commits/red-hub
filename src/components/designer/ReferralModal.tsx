"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const TERMS_URL = "https://www.carpetshop.co.il/policies/terms-of-service";

const VALIDATION_FIELD_TYPES = [
  "שם מלא לקוח",
  "טלפון משני",
  "סניף",
  "איש מכירות",
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
  onSuccess: (message?: string | null) => void;
}) {
  const [phone, setPhone] = useState("");
  const [commissionSum, setCommissionSum] = useState("");
  const [fieldType, setFieldType] = useState<string>(VALIDATION_FIELD_TYPES[0]);
  const [fieldValue, setFieldValue] = useState("");
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
    if (!commissionSum.trim()) {
      setError("יש להזין סכום");
      return;
    }
    if (!fieldValue.trim()) {
      setError("יש להזין ערך לשדה הנוסף");
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
          validationPhone: phone.trim(),
          validationComSum: commissionSum.trim(),
          validationfieldType: fieldType,
          validationfieldValue: fieldValue.trim(),
        }),
      });
      let data: { success?: boolean; error?: string; message?: string | null; response?: string; respond?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || data.success === false) {
        const apiMsg =
          (typeof data.error === "string" && data.error.trim()) ||
          (typeof data.response === "string" && data.response.trim()) ||
          (typeof data.respond === "string" && data.respond.trim());
        setError(apiMsg || "שגיאה");
        return;
      }
      const okMessage =
        (typeof data.message === "string" && data.message.trim()) ||
        (typeof data.response === "string" && data.response.trim()) ||
        (typeof data.respond === "string" && data.respond.trim()) ||
        null;
      onSuccess(okMessage);
      onClose();
      setPhone("");
      setCommissionSum("");
      setFieldType(VALIDATION_FIELD_TYPES[0]);
      setFieldValue("");
      setDeclarationAccepted(false);
    } catch {
      setError("שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="הפניה חדשה"
      preventDismiss={loading}
    >
      <div className="relative">
        {loading && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 backdrop-blur-[2px] px-4 py-8"
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="h-10 w-10 rounded-full border-2 border-[var(--brand-red)]/30 border-t-[var(--brand-red)] animate-spin"
              style={{ animationDuration: "var(--motion-duration-slow, 0.8s)" }}
              aria-hidden
            />
            <p className="text-sm text-center text-gray-700 leading-relaxed">מעבדים את הבקשה, נא להמתין…</p>
            <p className="text-xs text-center text-gray-500 leading-relaxed">התהליך עשוי לקחת מספר רגעים</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className={`space-y-4 ${loading ? "pointer-events-none opacity-50" : ""}`} dir="rtl">
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
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">סכום עסקה *</label>
          <input
            type="number"
            value={commissionSum}
            onChange={(e) => setCommissionSum(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors text-right"
            dir="ltr"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">בחר שדה אימות נוסף</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors text-right"
          >
            {VALIDATION_FIELD_TYPES.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">ערך</label>
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors text-right"
            required
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
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[var(--brand-red)] text-white font-medium hover:bg-[var(--brand-red-hover)] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 transition-colors active:scale-[0.99]"
          >
            {loading ? "שולח…" : "שליחה"}
          </button>
        </div>
      </form>
      </div>
    </Modal>
  );
}
