"use client";

import { useEffect, useState } from "react";
import type { BusinessInfo } from "@/lib/erp";

/** סוג העוסק — option values from reference */
const COMPANY_TYPE_OPTIONS = [
  { value: "", label: "בחר" },
  { value: "עוסק פטור", label: "עוסק פטור" },
  { value: "מורשה", label: "מורשה" },
  { value: "חברה בע''מ", label: "חברה בע''מ" },
];

/** סוג עיצוב — option values from reference */
const DESIGNER_TYPE_OPTIONS = [
  { value: "", label: "בחר" },
  { value: "אדריכל/ית", label: "אדריכל/ית" },
  { value: "מעצב/ת פנים", label: "מעצב/ת פנים" },
  { value: "מלביש/ת בתים", label: "מלביש/ת בתים" },
  { value: "אחר", label: "אחר" },
];

/** סוג התמחות — option values from reference */
const SPECIALITY_OPTIONS = [
  { value: "", label: "בחר" },
  { value: "פרטי", label: "פרטי" },
  { value: "מוסדי", label: "מוסדי" },
  { value: "פרטי + מוסדי", label: "פרטי + מוסדי" },
];

/** וותק במקצוע — option values from reference */
const EXPERIENCE_OPTIONS = [
  { value: "", label: "בחר" },
  { value: "0-2 שנים", label: "0-2 שנים" },
  { value: "2-5 שנים", label: "2-5 שנים" },
  { value: "5-10 שנים", label: "5-10 שנים" },
  { value: "11 שנים ומעלה", label: "11 שנים ומעלה" },
];

/** איך שמעת עלינו — option values from reference */
const HOW_DID_YOU_HEAR_OPTIONS = [
  { value: "", label: "בחר" },
  { value: "ביקור בסניף", label: "ביקור בסניף" },
  { value: "המלצה מחבר", label: "המלצה מחבר" },
  { value: "פרסום בדיגיטל", label: "פרסום בדיגיטל" },
  { value: "כנסים ואירועים", label: "כנסים ואירועים" },
  { value: "אחר", label: "אחר" },
];

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
  experienceYears: "",
  howDidYouHear: "",
  bankType: "",
  bankBranch: "",
  bankNo: "",
};

const inputBase =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-shadow";

const labelBase = "block text-sm font-medium text-gray-700 mb-1.5";

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
          experienceYears: data.experienceYears ?? "",
          howDidYouHear: data.howDidYouHear ?? "",
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
          experienceYears: form.experienceYears,
          howDidYouHear: form.howDidYouHear,
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
    return (
      <div
        className="animate-pulse h-96 rounded-2xl bg-gray-100"
        style={{ boxShadow: "var(--shadow-card)" }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl animate-in-fade-up"
    >
      <div
        className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-[var(--shadow-card)]"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {error && (
          <div
            className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* פרטים אישיים */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-4 pb-2 border-b border-gray-200">
            פרטים אישיים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase}>שם מלא</label>
              <input
                type="text"
                value={form.fullName ?? ""}
                onChange={(e) => update("fullName", e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>טלפון נייד</label>
              <input
                type="tel"
                value={form.phoneNumber ?? ""}
                readOnly
                className={`${inputBase} bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed`}
                dir="ltr"
                aria-readonly="true"
              />
              <p className="text-xs text-gray-500 mt-1">לא ניתן לעריכה</p>
            </div>
            <div className="md:col-span-2">
              <label className={labelBase}>כתובת אי-מייל</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
                className={inputBase}
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelBase}>תאריך לידה (רשות)</label>
              <input
                type="text"
                value={form.birthday ?? ""}
                onChange={(e) => update("birthday", e.target.value)}
                placeholder="dd/mm/yyyy"
                className={inputBase}
                dir="ltr"
              />
            </div>
          </div>
        </section>

        {/* פרטי העסק */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-4 pb-2 border-b border-gray-200">
            פרטי העסק
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase}>שם העסק</label>
              <input
                type="text"
                value={form.companyName ?? ""}
                onChange={(e) => update("companyName", e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>סוג העוסק</label>
              <select
                value={form.companyType ?? ""}
                onChange={(e) => update("companyType", e.target.value)}
                className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              >
                {COMPANY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelBase}>ח.פ / ת.ז (עוסק פטור)</label>
              <input
                type="text"
                value={form.vatNo ?? ""}
                onChange={(e) => update("vatNo", e.target.value)}
                className={inputBase}
                dir="ltr"
                placeholder="ח.פ / מע״מ"
              />
            </div>
            <div>
              <label className={labelBase}>כתובת העסק</label>
              <input
                type="text"
                value={form.companyAddress ?? ""}
                onChange={(e) => update("companyAddress", e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>עיר</label>
              <input
                type="text"
                value={form.companyCity ?? ""}
                onChange={(e) => update("companyCity", e.target.value)}
                className={inputBase}
              />
            </div>
          </div>
        </section>

        {/* סוג עיצוב והתמחות */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-4 pb-2 border-b border-gray-200">
            סוג עיצוב והתמחות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase}>סוג עיצוב</label>
              <select
                value={form.designerType ?? ""}
                onChange={(e) => update("designerType", e.target.value)}
                className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              >
                {DESIGNER_TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelBase}>סוג התמחות</label>
              <select
                value={form.speciality ?? ""}
                onChange={(e) => update("speciality", e.target.value)}
                className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              >
                {SPECIALITY_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelBase}>וותק במקצוע</label>
              <select
                value={form.experienceYears ?? ""}
                onChange={(e) => update("experienceYears", e.target.value)}
                className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              >
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelBase}>איך שמעת עלינו</label>
              <select
                value={form.howDidYouHear ?? ""}
                onChange={(e) => update("howDidYouHear", e.target.value)}
                className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
              >
                {HOW_DID_YOU_HEAR_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* פרטי בנק */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-4 pb-2 border-b border-gray-200">
            פרטי בנק
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase}>סוג בנק</label>
              <input
                type="text"
                value={form.bankType ?? ""}
                onChange={(e) => update("bankType", e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>סניף בנק</label>
              <input
                type="text"
                value={form.bankBranch ?? ""}
                onChange={(e) => update("bankBranch", e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>מספר חשבון</label>
              <input
                type="text"
                value={form.bankNo ?? ""}
                onChange={(e) => update("bankNo", e.target.value)}
                className={inputBase}
                dir="ltr"
              />
            </div>
          </div>
        </section>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto md:min-w-[200px] py-3 px-6 rounded-xl bg-[var(--brand-red)] text-white font-semibold disabled:opacity-60 hover:bg-[var(--brand-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 transition-colors shadow-md hover:shadow-lg"
          >
            {saving ? "שומר..." : "שמור פרטים"}
          </button>
        </div>
      </div>
    </form>
  );
}
