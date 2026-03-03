"use client";

import { useEffect, useState } from "react";
import type { BusinessInfo } from "@/lib/erp";

const emptyForm: BusinessInfo = {
  fullName: "",
  phoneNumber: "",
  email: "",
  companyName: "",
  companyType: "",
  vatNo: "",
  companyAddress: "",
  companyCity: "",
  designerType: "",
  speciality: "",
  birthday: "",
  bankType: "",
  bankBranch: "",
  bankNo: "",
};

export function BusinessCardForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<BusinessInfo>(emptyForm);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setForm({
          fullName: data.fullName ?? "",
          phoneNumber: data.phoneNumber ?? "",
          email: data.email ?? "",
          companyName: data.companyName ?? "",
          companyType: data.companyType ?? "",
          vatNo: data.vatNo ?? "",
          companyAddress: data.companyAddress ?? "",
          companyCity: data.companyCity ?? "",
          designerType: data.designerType ?? "",
          speciality: data.speciality ?? "",
          birthday: data.birthday ?? "",
          bankType: data.bankType ?? "",
          bankBranch: data.bankBranch ?? "",
          bankNo: data.bankNo ?? "",
        });
      })
      .catch(() => setError("שגיאה בטעינת הנתונים"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          companyAddress: form.companyAddress,
          companyCity: form.companyCity,
          companyType: form.companyType,
          birthday: form.birthday,
          email: form.email,
          companyName: form.companyName,
          vatNo: form.vatNo,
          designerType: form.designerType,
          speciality: form.speciality,
          bankType: form.bankType,
          bankBranch: form.bankBranch,
          bankNo: form.bankNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בשמירה");
      alert("נשמר בהצלחה");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  const update = (key: keyof BusinessInfo, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" style={{ borderRadius: "var(--radius-card)" }} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl animate-in-fade-up">
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
        <input
          type="text"
          value={form.fullName ?? ""}
          onChange={(e) => update("fullName", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון נייד</label>
        <input
          type="tel"
          value={form.phoneNumber ?? ""}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600 cursor-not-allowed"
          dir="ltr"
          aria-readonly="true"
        />
        <p className="text-xs text-gray-500 mt-0.5">לא ניתן לעריכה</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">כתובת אי-מייל</label>
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => update("email", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם החברה</label>
        <input
          type="text"
          value={form.companyName ?? ""}
          onChange={(e) => update("companyName", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סוג חברה (ח.פ)</label>
        <input
          type="text"
          value={form.companyType ?? ""}
          onChange={(e) => update("companyType", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ח.פ / מע״מ</label>
        <input
          type="text"
          value={form.vatNo ?? ""}
          onChange={(e) => update("vatNo", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">כתובת העסק</label>
        <input
          type="text"
          value={form.companyAddress ?? ""}
          onChange={(e) => update("companyAddress", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
        <input
          type="text"
          value={form.companyCity ?? ""}
          onChange={(e) => update("companyCity", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סוג מעצב</label>
        <input
          type="text"
          value={form.designerType ?? ""}
          onChange={(e) => update("designerType", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">התמחות</label>
        <input
          type="text"
          value={form.speciality ?? ""}
          onChange={(e) => update("speciality", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תאריך לידה (dd/mm/yyyy)</label>
        <input
          type="text"
          value={form.birthday ?? ""}
          onChange={(e) => update("birthday", e.target.value)}
          placeholder="18/06/1971"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סוג בנק</label>
        <input
          type="text"
          value={form.bankType ?? ""}
          onChange={(e) => update("bankType", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סניף בנק</label>
        <input
          type="text"
          value={form.bankBranch ?? ""}
          onChange={(e) => update("bankBranch", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">מספר חשבון</label>
        <input
          type="text"
          value={form.bankNo ?? ""}
          onChange={(e) => update("bankNo", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
          dir="ltr"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold disabled:opacity-60 hover:bg-[var(--brand-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2"
      >
        {saving ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}
