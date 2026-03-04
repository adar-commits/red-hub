"use client";

import { useState, useCallback } from "react";

interface AnnouncementRow {
  id: string;
  title: string;
  content: string | null;
  is_published: boolean;
  created_at: string;
  display_at?: string | null;
  sort_order?: number | null;
}

function formatDisplayDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return "";
  }
}

function parseDisplayDateTime(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return "";
  const [dPart, tPart] = trimmed.split(/\s+/);
  if (!dPart) return "";
  const [dd, mm, yyyy] = dPart.split("/");
  if (!dd || !mm || !yyyy) return "";
  const [hh, min] = (tPart ?? "00:00").split(":");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${(hh ?? "00").padStart(2, "0")}:${(min ?? "00").padStart(2, "0")}:00`;
}

export function SettingsAnnouncementsClient({
  initialList,
}: {
  initialList: AnnouncementRow[];
}) {
  const [list, setList] = useState(initialList);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const saveRow = useCallback(
    async (row: AnnouncementRow) => {
      setSaving(true);
      try {
        const res = await fetch("/api/admin/announcements", {
          method: row.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: row.id || undefined,
            title: row.title,
            content: row.content ?? "",
            subtitle: row.content ?? "",
            is_published: row.is_published,
            display_at: row.display_at ? formatDisplayDateTime(row.display_at) : undefined,
          }),
        });
        if (!res.ok) throw new Error("שגיאה");
        const data = await res.json();
        if (row.id) {
          setList((prev) => prev.map((a) => (a.id === row.id ? { ...a, ...data } : a)));
        } else {
          setList((prev) => [data, ...prev]);
        }
        setEditing(null);
      } catch {
        alert("שגיאה בשמירה");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const displayAt = editing.display_at;
    const iso =
      typeof displayAt === "string" && displayAt.includes("T")
        ? displayAt
        : parseDisplayDateTime(displayAt as string);
    saveRow({ ...editing, display_at: iso || undefined });
  };

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

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() =>
          setEditing({
            id: "",
            title: "",
            content: "",
            is_published: false,
            created_at: "",
            display_at: formatDisplayDateTime(new Date().toISOString()),
          })
        }
        className="px-4 py-2 rounded-xl bg-[var(--brand-red)] text-white font-medium hover:bg-[var(--brand-red-hover)]"
      >
        הוספת עדכון
      </button>

      {editing && (
        <form
          onSubmit={handleSave}
          className="p-5 rounded-xl border border-gray-200 bg-white space-y-4 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900">
            {editing.id ? "עריכת עדכון" : "עדכון חדש"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תאריך ושעה (dd/mm/yyyy hh:mm)
              </label>
              <input
                type="text"
                value={
                  editing.display_at
                    ? editing.display_at.includes("T")
                      ? formatDisplayDateTime(editing.display_at)
                      : String(editing.display_at)
                    : formatDisplayDateTime(editing.created_at)
                }
                onChange={(e) =>
                  setEditing((x) => (x ? { ...x, display_at: e.target.value } : null))
                }
                placeholder="dd/mm/yyyy hh:mm"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) =>
                  setEditing((x) => (x ? { ...x, title: e.target.value } : null))
                }
                placeholder="כותרת"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תת־כותרת / תוכן</label>
            <textarea
              value={editing.content ?? ""}
              onChange={(e) =>
                setEditing((x) => (x ? { ...x, content: e.target.value } : null))
              }
              placeholder="תיאור קצר"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) =>
                setEditing((x) => (x ? { ...x, is_published: e.target.checked } : null))
              }
            />
            <span className="text-sm font-medium text-gray-700">פעיל (מוצג במסך הבית)</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[var(--brand-red)] text-white disabled:opacity-60"
            >
              {saving ? "שומר..." : "שמור"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <p className="text-sm text-gray-600">גרור לשינוי סדר</p>
        {list.map((a) => (
          <div
            key={a.id}
            draggable
            onDragStart={(e) => onDragStart(e, a.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, a.id)}
            onDragEnd={onDragEnd}
            className={`p-4 rounded-xl border bg-white flex items-center gap-3 ${
              draggedId === a.id ? "opacity-50 border-[var(--brand-red)]" : "border-gray-200"
            }`}
          >
            <span className="text-gray-400 cursor-grab" aria-hidden>
              ⋮⋮
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{a.title}</p>
              <p className="text-sm text-gray-500">
                {formatDisplayDateTime(a.display_at || a.created_at)} ·{" "}
                {a.is_published ? "פעיל" : "לא פעיל"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing({ ...a, display_at: a.display_at || a.created_at })}
              className="text-sm text-[var(--brand-red)] hover:underline"
            >
              עריכה
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
