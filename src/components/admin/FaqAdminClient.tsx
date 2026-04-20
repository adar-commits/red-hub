"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FaqDocumentPayload } from "@/lib/faq-shared";

type LocalItem = { localId: string; title: string; body: string };
type LocalSection = { localId: string; heading: string; items: LocalItem[] };

function newLocalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toLocal(doc: FaqDocumentPayload): { settings: FaqDocumentPayload["settings"]; sections: LocalSection[] } {
  return {
    settings: { ...doc.settings },
    sections: doc.sections.map((sec) => ({
      localId: newLocalId(),
      heading: sec.heading,
      items: sec.items.map((it) => ({
        localId: newLocalId(),
        title: it.title,
        body: it.body,
      })),
    })),
  };
}

function toPayload(settings: FaqDocumentPayload["settings"], sections: LocalSection[]): FaqDocumentPayload {
  return {
    settings,
    sections: sections.map((sec) => ({
      heading: sec.heading,
      items: sec.items.map((it) => ({ title: it.title, body: it.body })),
    })),
  };
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

export function FaqAdminClient({ initial }: { initial: FaqDocumentPayload }) {
  const initialLocal = useMemo(() => toLocal(initial), [initial]);
  const [settings, setSettings] = useState(initialLocal.settings);
  const [sections, setSections] = useState<LocalSection[]>(initialLocal.sections);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaveSuccess(false);
  }, []);

  useEffect(() => {
    if (!saveSuccess) return;
    const t = window.setTimeout(() => setSaveSuccess(false), 5000);
    return () => window.clearTimeout(t);
  }, [saveSuccess]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(settings, sections)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err?.error === "string" ? err.error : "שגיאה");
      }
      const next = (await res.json()) as FaqDocumentPayload;
      const loc = toLocal(next);
      setSettings(loc.settings);
      setSections(loc.sections);
      setDirty(false);
      setSaveSuccess(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const reorderSections = useCallback(
    (next: LocalSection[]) => {
      setSections(next);
      markDirty();
    },
    [markDirty],
  );

  const onSectionDragStart = (e: React.DragEvent, id: string) => {
    setDraggedSectionId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onSectionDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDraggedSectionId(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id || id === targetId) return;
    const fromIndex = sections.findIndex((s) => s.localId === id);
    const toIndex = sections.findIndex((s) => s.localId === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...sections];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    reorderSections(next);
  };
  const onSectionDragEnd = () => setDraggedSectionId(null);

  const moveItem = (sectionIdx: number, itemIdx: number, dir: -1 | 1) => {
    const sec = sections[sectionIdx];
    if (!sec) return;
    const ni = itemIdx + dir;
    if (ni < 0 || ni >= sec.items.length) return;
    const nextItems = [...sec.items];
    const [removed] = nextItems.splice(itemIdx, 1);
    nextItems.splice(ni, 0, removed);
    const nextSections = sections.map((s, i) => (i === sectionIdx ? { ...s, items: nextItems } : s));
    setSections(nextSections);
    markDirty();
  };

  const addSection = () => {
    setSections((prev) => [...prev, { localId: newLocalId(), heading: "כותרת מקטע חדש", items: [] }]);
    markDirty();
  };

  const removeSection = (idx: number) => {
    if (!confirm("למחוק את המקטע וכל השאלות בתוכו?")) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  const addItem = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx ? { ...s, items: [...s.items, { localId: newLocalId(), title: "", body: "" }] } : s,
      ),
    );
    markDirty();
  };

  const removeItem = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIdx ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) } : s)),
    );
    markDirty();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm text-gray-600">
            {dirty ? "יש שינויים שלא נשמרו." : "כל השינויים נשמרו."}
          </p>
          {saveSuccess && (
            <p
              role="status"
              aria-live="polite"
              className="text-sm font-medium text-green-700"
            >
              השמירה בוצעה בהצלחה.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-[var(--brand-red)] px-5 py-2.5 font-medium text-white hover:bg-[var(--brand-red-hover)] disabled:opacity-60"
        >
          {saving ? "שומר…" : "שמור את כל עמוד השאלות הנפוצות"}
        </button>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">כותרות העמוד</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="faq-page-title" className="mb-1 block text-sm font-medium text-gray-700">
              כותרת ראשית (H1)
            </label>
            <input
              id="faq-page-title"
              type="text"
              value={settings.page_title}
              onChange={(e) => {
                setSettings((s) => ({ ...s, page_title: e.target.value }));
                markDirty();
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>
          <div>
            <label htmlFor="faq-page-sub" className="mb-1 block text-sm font-medium text-gray-700">
              כותרת משנה
            </label>
            <input
              id="faq-page-sub"
              type="text"
              value={settings.page_subtitle}
              onChange={(e) => {
                setSettings((s) => ({ ...s, page_subtitle: e.target.value }));
                markDirty();
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="faq-yt" className="mb-1 block text-sm font-medium text-gray-700">
              מזהה סרטון YouTube (למשל JwEtvwQbnC8) — השאירו ריק כדי להסתיר את המסגרת
            </label>
            <input
              id="faq-yt"
              type="text"
              value={settings.youtube_video_id}
              onChange={(e) => {
                setSettings((s) => ({ ...s, youtube_video_id: e.target.value }));
                markDirty();
              }}
              placeholder="JwEtvwQbnC8"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-950"
            />
          </div>
          <div>
            <label htmlFor="faq-iframe-title" className="mb-1 block text-sm font-medium text-gray-700">
              כותרת נגישות לסרטון (title של ה־iframe)
            </label>
            <input
              id="faq-iframe-title"
              type="text"
              value={settings.video_iframe_title}
              onChange={(e) => {
                setSettings((s) => ({ ...s, video_iframe_title: e.target.value }));
                markDirty();
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">גררו מקטעים לפי הסדר המוצג במסך המעצבים</p>
        <button
          type="button"
          onClick={addSection}
          className="rounded-lg border border-[var(--brand-red)] px-4 py-2 text-sm font-medium text-[var(--brand-red)] hover:bg-red-50"
        >
          + מקטע חדש
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((sec, si) => (
          <div
            key={sec.localId}
            draggable
            onDragStart={(e) => onSectionDragStart(e, sec.localId)}
            onDragOver={onSectionDragOver}
            onDrop={(e) => onSectionDrop(e, sec.localId)}
            onDragEnd={onSectionDragEnd}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              draggedSectionId === sec.localId ? "border-[var(--brand-red)] opacity-70" : "border-gray-200"
            }`}
          >
            <div className="flex flex-wrap items-start gap-3 border-b border-gray-100 pb-4">
              <span className="mt-2 cursor-grab text-gray-400 active:cursor-grabbing" title="גרירת מקטע" aria-hidden>
                <IconGrip />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">כותרת המקטע</label>
                <input
                  type="text"
                  value={sec.heading}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSections((prev) => prev.map((s, i) => (i === si ? { ...s, heading: v } : s)));
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-950"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSection(si)}
                className="shrink-0 text-sm text-red-600 hover:underline"
              >
                מחק מקטע
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800">שאלות ותשובות במקטע</span>
                <button
                  type="button"
                  onClick={() => addItem(si)}
                  className="text-sm font-medium text-[var(--brand-red)] hover:underline"
                >
                  + שאלה חדשה
                </button>
              </div>

              {sec.items.length === 0 ? (
                <p className="text-sm text-gray-500">אין פריטים — לחצו &quot;שאלה חדשה&quot;.</p>
              ) : (
                sec.items.map((item, ii) => (
                  <div
                    key={item.localId}
                    className="space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-label="הזז למעלה"
                        onClick={() => moveItem(si, ii, -1)}
                        disabled={ii === 0}
                        className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="הזז למטה"
                        onClick={() => moveItem(si, ii, 1)}
                        disabled={ii === sec.items.length - 1}
                        className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(si, ii)}
                        className="ms-auto text-xs text-red-600 hover:underline"
                      >
                        מחק שאלה
                      </button>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">כותרת השאלה</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSections((prev) =>
                            prev.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    items: s.items.map((it, j) => (j === ii ? { ...it, title: v } : it)),
                                  }
                                : s,
                            ),
                          );
                          markDirty();
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">תשובה (טקסט מלא)</label>
                      <textarea
                        value={item.body}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSections((prev) =>
                            prev.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    items: s.items.map((it, j) => (j === ii ? { ...it, body: v } : it)),
                                  }
                                : s,
                            ),
                          );
                          markDirty();
                        }}
                        rows={6}
                        className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed text-gray-950"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-[var(--brand-red)] px-5 py-2.5 font-medium text-white hover:bg-[var(--brand-red-hover)] disabled:opacity-60"
        >
          {saving ? "שומר…" : "שמור את כל עמוד השאלות הנפוצות"}
        </button>
      </div>
    </div>
  );
}
