"use client";

import { useEffect, useState } from "react";

const BUSINESS_TYPES = ["עוסק מורשה", "עוסק פטור", "חברה"];
const DESIGN_TYPES = ["פנים", "חוץ", "משולב"];
const SPECIALIZATIONS = ["מגורים", "מסחר", "משרדים", "אחר"];
const EXPERIENCE = ["פחות משנה", "1-5", "5-10", "מעל 10"];
const HOW_HEARD = ["חיפוש", "המלצה", "פייסבוק", "אחר"];

export function BusinessCardForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    business_name: "",
    business_type: "",
    company_id: "",
    business_address: "",
    city: "",
    design_type: "",
    specialization: "",
    experience_years: "",
    how_heard: "",
    date_of_birth: "",
    marketing_consent: false,
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          business_name: data.business_name ?? "",
          business_type: data.business_type ?? "",
          company_id: data.company_id ?? "",
          business_address: data.business_address ?? "",
          city: data.city ?? "",
          design_type: data.design_type ?? "",
          specialization: data.specialization ?? "",
          experience_years: data.experience_years ?? "",
          how_heard: data.how_heard ?? "",
          date_of_birth: data.date_of_birth ?? "",
          marketing_consent: data.marketing_consent ?? false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("שגיאה בשמירה");
      alert("נשמר בהצלחה");
    } catch {
      alert("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
        <input type="text" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון נייד</label>
        <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" dir="ltr" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">כתובת אי-מייל</label>
        <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" dir="ltr" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
        <input type="text" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סוג העוסק</label>
        <select value={form.business_type} onChange={(e) => setForm((f) => ({ ...f, business_type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2">
          <option value="">בחר</option>
          {BUSINESS_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ח.פ / ת.ז (עוסק פטור)</label>
        <input type="text" value={form.company_id} onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" dir="ltr" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">כתובת העסק</label>
        <input type="text" value={form.business_address} onChange={(e) => setForm((f) => ({ ...f, business_address: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
        <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סוג עיצוב</label>
        <select value={form.design_type} onChange={(e) => setForm((f) => ({ ...f, design_type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2">
          <option value="">בחר</option>
          {DESIGN_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סוג התמחות</label>
        <select value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2">
          <option value="">בחר</option>
          {SPECIALIZATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">וותק במקצוע</label>
        <select value={form.experience_years} onChange={(e) => setForm((f) => ({ ...f, experience_years: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2">
          <option value="">בחר</option>
          {EXPERIENCE.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">איך שמעת עלינו</label>
        <select value={form.how_heard} onChange={(e) => setForm((f) => ({ ...f, how_heard: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2">
          <option value="">בחר</option>
          {HOW_HEARD.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תאריך לידה (רשות)</label>
        <input type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2" />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.marketing_consent} onChange={(e) => setForm((f) => ({ ...f, marketing_consent: e.target.checked }))} />
        <span className="text-sm">אני מאשר/ת קבלת דיוור ומידע פרסומי</span>
      </label>
      <button type="submit" disabled={saving} className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold disabled:opacity-60">
        {saving ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}
