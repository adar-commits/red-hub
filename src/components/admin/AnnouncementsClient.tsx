"use client";

import { useState, useCallback } from "react";

interface AnnouncementRow {
  id: string;
  title: string;
  content: string | null;
  is_published: boolean;
  link_href?: string | null;
  created_at: string;
  updated_at?: string | null;
  sort_order?: number | null;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function IconHidden({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconVisible({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconGrip({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

export function AnnouncementsClient({ initialList }: { initialList: AnnouncementRow[] }) {
  const [list, setList] = useState(initialList);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleReorder = useCallback(async (newOrder: AnnouncementRow[]) => {
    setList(newOrder);
    const order = newOrder.map((a) => a.id);
    try {
      await fetch("/api/admin/announcements/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
    } catch {
      alert("שגיאה בשמירת הסדר");
    }
  }, []);

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDraggedId(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id || id === targetId) return;
    const fromIndex = list.findIndex((a) => a.id === id);
    const toIndex = list.findIndex((a) => a.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...list];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    handleReorder(next);
  };
  const onDragEnd = () => setDraggedId(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: editing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id || undefined,
          title: editing.title,
          content: editing.content,
          is_published: editing.is_published,
          link_href: editing.link_href?.trim() ?? "",
        }),
      });
      if (!res.ok) throw new Error("שגיאה");
      const data = (await res.json()) as AnnouncementRow;
      if (editing.id) {
        setList((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...data } : a)));
      } else {
        setList((prev) => [...prev, data]);
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
        onClick={() =>
          setEditing({
            id: "",
            title: "",
            content: "",
            is_published: false,
            link_href: "",
            created_at: "",
            updated_at: null,
            sort_order: null,
          })
        }
        className="rounded-lg bg-[var(--brand-red)] px-4 py-2 font-medium text-white hover:bg-[var(--brand-red-hover)]"
      >
        הוספת הודעה
      </button>

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          dir="rtl"
        >
          <h3 className="font-semibold text-gray-900">{editing.id ? "עריכת הודעה" : "הודעה חדשה"}</h3>
          <div>
            <label htmlFor="ann-title" className="mb-1 block text-sm font-medium text-gray-700">
              כותרת
            </label>
            <input
              id="ann-title"
              type="text"
              value={editing.title}
              onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
              placeholder="כותרת"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>
          <div>
            <label htmlFor="ann-content" className="mb-1 block text-sm font-medium text-gray-700">
              תוכן מלא
            </label>
            <textarea
              id="ann-content"
              value={editing.content ?? ""}
              onChange={(e) => setEditing((x) => (x ? { ...x, content: e.target.value } : null))}
              placeholder="כתבו כאן את תוכן ההודעה…"
              rows={16}
              className="min-h-[22rem] w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed text-gray-950"
            />
          </div>
          <div>
            <label htmlFor="ann-href" className="mb-1 block text-sm font-medium text-gray-700">
              קישור (אופציונלי)
            </label>
            <p className="mb-1 text-xs text-gray-500">
              כל הכרטיס יהפוך ללחיץ. URL מלא (https://…) או עמוד באתר (למשל <span dir="ltr">/faq</span>).
            </p>
            <input
              id="ann-href"
              type="text"
              inputMode="url"
              value={editing.link_href ?? ""}
              onChange={(e) => setEditing((x) => (x ? { ...x, link_href: e.target.value } : null))}
              placeholder="https://… ‏או ‏/faq"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-950"
              dir="ltr"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) => setEditing((x) => (x ? { ...x, is_published: e.target.checked } : null))}
            />
            <span className="text-sm font-medium text-gray-700">פורסם (גלוי למעצבים)</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? "שומר…" : "שמור"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-gray-300 px-4 py-2">
              ביטול
            </button>
          </div>
        </form>
      )}

      <p className="text-sm text-gray-600">גרור כרטיסים לשינוי הסדר המוצג למעצבים</p>

      <div className="space-y-2">
        {list.map((a) => (
          <div
            key={a.id}
            draggable
            onDragStart={(e) => onDragStart(e, a.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, a.id)}
            onDragEnd={onDragEnd}
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 ${
              draggedId === a.id ? "border-[var(--brand-red)] opacity-60" : "border-gray-200"
            }`}
          >
            <span className="mt-0.5 cursor-grab text-gray-400 active:cursor-grabbing" title="גרירה לסידור" aria-hidden>
              <IconGrip />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-gray-950">{a.title}</p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.is_published ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                  title={a.is_published ? "גלוי" : "מוסתר / טיוטה"}
                >
                  {a.is_published ? (
                    <>
                      <IconVisible className="text-emerald-700" />
                      פורסם
                    </>
                  ) : (
                    <>
                      <IconHidden className="text-slate-600" />
                      מוסתר
                    </>
                  )}
                </span>
              </div>
                <p className="mt-1 text-xs text-gray-500">
                נוצר: {formatDateTime(a.created_at)}
                {a.updated_at && a.updated_at !== a.created_at ? ` · עודכן: ${formatDateTime(a.updated_at)}` : null}
                {a.link_href?.trim() ? (
                  <span className="ms-1" dir="ltr">
                    {" "}
                    · קישור: {a.link_href.trim()}
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing({ ...a })}
              className="shrink-0 text-sm text-[var(--brand-red)] hover:underline"
            >
              עריכה
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
