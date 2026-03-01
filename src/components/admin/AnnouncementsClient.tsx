"use client";

import { useState } from "react";

interface AnnouncementRow {
  id: string;
  title: string;
  content: string | null;
  is_published: boolean;
  created_at: string;
}

export function AnnouncementsClient({ initialList }: { initialList: AnnouncementRow[] }) {
  const [list, setList] = useState(initialList);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          title: editing.title,
          content: editing.content,
          is_published: editing.is_published,
        }),
      });
      if (!res.ok) throw new Error("שגיאה");
      const data = await res.json();
      if (editing.id) {
        setList((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...data } : a)));
      } else {
        setList((prev) => [data, ...prev]);
      }
      setEditing(null);
    } catch {
      alert("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setEditing({ id: "", title: "", content: "", is_published: false, created_at: "" })}
        className="px-4 py-2 rounded-lg bg-[var(--brand-red)] text-white font-medium"
      >
        הוספת הודעה
      </button>
      {editing && (
        <form onSubmit={handleSave} className="p-4 bg-white rounded-xl border space-y-3">
          <input
            type="text"
            value={editing.title}
            onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
            placeholder="כותרת"
            className="w-full rounded-lg border px-3 py-2"
          />
          <textarea
            value={editing.content ?? ""}
            onChange={(e) => setEditing((x) => (x ? { ...x, content: e.target.value } : null))}
            placeholder="תוכן"
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) => setEditing((x) => (x ? { ...x, is_published: e.target.checked } : null))}
            />
            <span>פורסם</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--brand-red)] text-white">שמור</button>
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border">ביטול</button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {list.map((a) => (
          <div key={a.id} className="p-4 bg-white rounded-xl border flex justify-between items-start">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-gray-500">{a.is_published ? "פורסם" : "טיוטה"}</p>
            </div>
            <button type="button" onClick={() => setEditing(a)} className="text-sm text-[var(--brand-red)]">עריכה</button>
          </div>
        ))}
      </div>
    </div>
  );
}
