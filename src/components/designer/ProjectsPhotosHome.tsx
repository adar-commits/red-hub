"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { DesignerProject } from "@/types/database";

function asStringArray(models: unknown): string[] {
  if (!Array.isArray(models)) return [];
  return models.filter((x): x is string => typeof x === "string");
}

export function ProjectsPhotosHome({
  initialProjects,
  listError = null,
}: {
  initialProjects: DesignerProject[];
  listError?: string | null;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [projectName, setProjectName] = useState("");
  const [address, setAddress] = useState("");
  const [photographerName, setPhotographerName] = useState("");
  const [photographerPhone, setPhotographerPhone] = useState("");
  const [modelRows, setModelRows] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addModelRow = useCallback(() => setModelRows((r) => [...r, ""]), []);
  const removeModelRow = useCallback((i: number) => {
    setModelRows((r) => r.filter((_, idx) => idx !== i));
  }, []);
  const setModelRow = useCallback((i: number, v: string) => {
    setModelRows((r) => r.map((x, idx) => (idx === i ? v : x)));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = projectName.trim();
    if (!name) {
      setError("חובה למלא שם פרויקט");
      return;
    }
    const carpet_models = modelRows.map((m) => m.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      const res = await fetch("/api/designer/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: name,
          address: address.trim() || null,
          photographer_name: photographerName.trim() || null,
          photographer_phone: photographerPhone.trim() || null,
          carpet_models,
        }),
      });
      const raw = await res.text();
      let data: DesignerProject | { error?: string } = {} as DesignerProject;
      try {
        data = raw ? (JSON.parse(raw) as DesignerProject & { error?: string }) : ({} as DesignerProject);
      } catch {
        throw new Error("תשובת השרת לא תקינה");
      }
      if (!res.ok) {
        const msg =
          "error" in data && typeof data.error === "string" && data.error
            ? data.error
            : "שגיאה ביצירת פרויקט";
        throw new Error(msg);
      }
      const created = data as DesignerProject;
      setProjects((p) => [created, ...p]);
      setProjectName("");
      setAddress("");
      setPhotographerName("");
      setPhotographerPhone("");
      setModelRows([""]);
      router.push(`/photos/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {listError && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {listError}
        </div>
      )}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--brand-red)]">פרויקט חדש</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              שם הפרויקט <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">כתובת</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
              autoComplete="street-address"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">שם הצלם</label>
              <input
                type="text"
                value={photographerName}
                onChange={(e) => setPhotographerName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון צלם</label>
              <input
                type="tel"
                value={photographerPhone}
                onChange={(e) => setPhotographerPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">דגמי שטיחים (דגם)</label>
              <button
                type="button"
                onClick={addModelRow}
                className="text-sm font-semibold text-[var(--brand-red)] hover:underline"
              >
                + הוסף דגם
              </button>
            </div>
            <div className="space-y-2">
              {modelRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => setModelRow(i, e.target.value)}
                    placeholder="שם דגם"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
                  />
                  {modelRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModelRow(i)}
                      className="shrink-0 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                      aria-label="הסר שורה"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-[var(--brand-red)] text-white font-semibold disabled:opacity-50 hover:bg-[var(--brand-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]"
          >
            {submitting ? "יוצר…" : "צור פרויקט והמשך להעלאת תמונות"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[var(--brand-red)] mb-3">הפרויקטים שלי</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm">עדיין אין פרויקטים. צרו פרויקט חדש למעלה.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/photos/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-[var(--brand-red)]/40 hover:shadow-sm transition-colors"
                >
                  <span className="font-medium text-gray-900">{p.project_name}</span>
                  <span className="text-sm text-[var(--brand-red)]">תמונות והגדרות ←</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function parseCarpetModelsFromProject(p: DesignerProject): string[] {
  return asStringArray(p.carpet_models);
}
