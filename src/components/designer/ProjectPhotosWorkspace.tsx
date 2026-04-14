"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { isProbablyImageFile, PROJECT_PHOTO_MAX_FILE_BYTES } from "@/lib/designer-project-photos-shared";
import type { DesignerProject } from "@/types/database";
import { parseCarpetModelsFromProject } from "@/components/designer/ProjectsPhotosHome";

export type PhotoListItem = {
  id: string;
  url: string | null;
  description: string | null;
  created_at: string;
};

function uploadOneFile(
  projectId: string,
  file: File,
  onProgress: (loaded: number, total: number) => void
): Promise<PhotoListItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            id: string;
            url: string | null;
            created_at: string;
            description?: string | null;
          };
          resolve({
            id: parsed.id,
            url: parsed.url ?? null,
            description: parsed.description ?? null,
            created_at: parsed.created_at,
          });
        } catch {
          reject(new Error("תשובת השרת לא תקינה"));
        }
      } else {
        try {
          const j = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(j.error || "העלאה נכשלה"));
        } catch {
          reject(new Error("העלאה נכשלה"));
        }
      }
    });
    xhr.addEventListener("error", () => reject(new Error("שגיאת רשת")));
    xhr.withCredentials = true;
    xhr.open("POST", `/api/designer/projects/${projectId}/photos`);
    xhr.send(form);
  });
}

export function ProjectPhotosWorkspace({
  projectId,
  initialProject,
}: {
  projectId: string;
  initialProject: DesignerProject;
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(initialProject.project_name);
  const [address, setAddress] = useState(initialProject.address ?? "");
  const [photographerName, setPhotographerName] = useState(initialProject.photographer_name ?? "");
  const [photographerPhone, setPhotographerPhone] = useState(initialProject.photographer_phone ?? "");
  const [modelRows, setModelRows] = useState<string[]>(() => {
    const m = parseCarpetModelsFromProject(initialProject);
    return m.length ? m : [""];
  });

  const [photos, setPhotos] = useState<PhotoListItem[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState("");

  const [queue, setQueue] = useState<File[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [uploadBatchTotal, setUploadBatchTotal] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [bytesProgress, setBytesProgress] = useState({ loaded: 0, total: 1 });

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setPhotosError("");
    setPhotosLoading(true);
    try {
      const res = await fetch(`/api/designer/projects/${projectId}/photos`);
      const raw = await res.text();
      const data = raw ? (JSON.parse(raw) as PhotoListItem[] | { error?: string }) : [];
      if (!res.ok) {
        const err = data && typeof data === "object" && "error" in data ? data.error : "";
        throw new Error(typeof err === "string" ? err : "טעינת תמונות נכשלה");
      }
      setPhotos(Array.isArray(data) ? data : []);
    } catch (e) {
      setPhotosError(e instanceof Error ? e.message : "שגיאה");
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next: File[] = [];
    for (const file of Array.from(list)) {
      if (!isProbablyImageFile(file)) continue;
      if (file.size > PROJECT_PHOTO_MAX_FILE_BYTES) continue;
      next.push(file);
    }
    if (next.length) setQueue((q) => [...q, ...next]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  async function saveMetadata() {
    setSaveError("");
    setSaveState("saving");
    const carpet_models = modelRows.map((m) => m.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/designer/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName.trim(),
          address: address.trim() || null,
          photographer_name: photographerName.trim() || null,
          photographer_phone: photographerPhone.trim() || null,
          carpet_models,
        }),
      });
      const raw = await res.text();
      const data = raw ? (JSON.parse(raw) as { error?: string }) : {};
      if (!res.ok) throw new Error(data.error || "שמירה נכשלה");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
      router.refresh();
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "שגיאה");
    }
  }

  async function runUploads() {
    if (queue.length === 0) return;
    const files = [...queue];
    setQueue([]);
    setUploadBatchTotal(files.length);
    setUploadOpen(true);
    setUploadPhase("uploading");
    setUploadError("");
    setCurrentFileProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        setBytesProgress({ loaded: 0, total: Math.max(files[i].size, 1) });
        setCurrentFileProgress(0);
        await uploadOneFile(projectId, files[i], (loaded, total) => {
          setBytesProgress({ loaded, total: Math.max(total, 1) });
          setCurrentFileProgress(total > 0 ? loaded / total : 0);
        });
        setCurrentFileProgress(1);
      }
      setUploadPhase("done");
      void loadPhotos();
      router.refresh();
    } catch (e) {
      setUploadPhase("error");
      setUploadError(e instanceof Error ? e.message : "שגיאה");
      void loadPhotos();
    }
  }

  async function deletePhoto(photoId: string) {
    if (!window.confirm("למחוק תמונה זו?")) return;
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/designer/projects/${projectId}/photos/${photoId}`, {
        method: "DELETE",
      });
      const raw = await res.text();
      const data = raw ? (JSON.parse(raw) as { error?: string }) : {};
      if (!res.ok) throw new Error(data.error || "מחיקה נכשלה");
      setPhotos((p) => p.filter((x) => x.id !== photoId));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteProject() {
    if (!window.confirm("למחוק את כל הפרויקט והתמונות? פעולה בלתי הפיכה.")) return;
    try {
      const res = await fetch(`/api/designer/projects/${projectId}`, { method: "DELETE" });
      const raw = await res.text();
      const data = raw ? (JSON.parse(raw) as { error?: string }) : {};
      if (!res.ok) throw new Error(data.error || "מחיקה נכשלה");
      router.push("/photos");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "שגיאה");
    }
  }

  const addModelRow = () => setModelRows((r) => [...r, ""]);
  const removeModelRow = (i: number) => setModelRows((r) => r.filter((_, idx) => idx !== i));
  const setModelRow = (i: number, v: string) => setModelRows((r) => r.map((x, idx) => (idx === i ? v : x)));

  const overallPct =
    uploadPhase === "uploading" && uploadBatchTotal > 0
      ? Math.min(100, ((currentFileIndex + currentFileProgress) / uploadBatchTotal) * 100)
      : uploadPhase === "done"
        ? 100
        : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/photos"
          className="text-sm font-medium text-[var(--brand-red)] hover:underline"
        >
          ← חזרה לרשימת פרויקטים
        </Link>
        <button
          type="button"
          onClick={deleteProject}
          className="text-sm text-red-600 hover:underline ms-auto"
        >
          מחק פרויקט
        </button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--brand-red)]">פרטי פרויקט</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              שם הפרויקט <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">כתובת</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם הצלם</label>
            <input
              type="text"
              value={photographerName}
              onChange={(e) => setPhotographerName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון צלם</label>
            <input
              type="tel"
              value={photographerPhone}
              onChange={(e) => setPhotographerPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">דגמי שטיחים</label>
            <button type="button" onClick={addModelRow} className="text-sm font-semibold text-[var(--brand-red)]">
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
                  placeholder="דגם"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none"
                />
                {modelRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModelRow(i)}
                    className="shrink-0 px-3 rounded-xl border border-gray-200"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveMetadata()}
            disabled={saveState === "saving" || !projectName.trim()}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-red)] text-white font-semibold disabled:opacity-50"
          >
            {saveState === "saving" ? "שומר…" : "שמור פרטים"}
          </button>
          {saveState === "saved" && <span className="text-sm text-green-600">נשמר</span>}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--brand-red)]">העלאת תמונות</h2>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/80 px-6 py-10 text-center transition-colors hover:border-[var(--brand-red)]/50"
        >
          <p className="text-gray-700 mb-3">גררו תמונות לכאן או בחרו קבצים</p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-red)] text-white font-medium cursor-pointer hover:bg-[var(--brand-red-hover)]">
            <input
              type="file"
              accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            בחר תמונות
          </label>
          <p className="text-xs text-gray-500 mt-2">עד 12MB לקובץ. סוגי קובץ: תמונות נפוצות כולל HEIC</p>
        </div>

        {queue.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">בתור ({queue.length})</p>
            <ul className="max-h-40 overflow-y-auto text-sm text-gray-600 space-y-1">
              {queue.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    className="text-red-600 shrink-0"
                    onClick={() => setQueue((q) => q.filter((_, idx) => idx !== i))}
                  >
                    הסר
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void runUploads()}
              className="px-6 py-3 rounded-xl bg-[var(--brand-red)] text-white font-semibold"
            >
              העלה {queue.length} קבצים
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-[var(--brand-red)] mb-3">תמונות בפרויקט</h2>
        {photosLoading && <p className="text-gray-500 text-sm">טוען…</p>}
        {photosError && (
          <p className="text-red-600 text-sm mb-2" role="alert">
            {photosError}
          </p>
        )}
        {!photosLoading && photos.length === 0 && (
          <p className="text-gray-500 text-sm">אין תמונות בפרויקט זה עדיין.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 group"
            >
              {p.url ? (
                <img src={p.url} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="aspect-square flex items-center justify-center text-xs text-gray-400 p-2">
                  לא ניתן לטעון תצוגה
                </div>
              )}
              <button
                type="button"
                onClick={() => void deletePhoto(p.id)}
                disabled={deletingId === p.id}
                className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold opacity-90 hover:opacity-100 disabled:opacity-50"
              >
                {deletingId === p.id ? "…" : "מחק"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={uploadOpen}
        onClose={() => {
          if (uploadPhase === "uploading") return;
          setUploadOpen(false);
          setUploadPhase("idle");
        }}
        title={uploadPhase === "done" ? "העלאה הושלמה" : uploadPhase === "error" ? "שגיאה" : "מעלה תמונות"}
        preventDismiss={uploadPhase === "uploading"}
      >
        {uploadPhase === "uploading" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              קובץ {currentFileIndex + 1} מתוך {uploadBatchTotal}
            </p>
            <p className="text-xs text-gray-500">התקדמות בקובץ הנוכחי</p>
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[var(--brand-red)] transition-all duration-150"
                style={{ width: `${Math.round(currentFileProgress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">התקדמות כללית ({uploadBatchTotal} קבצים)</p>
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[var(--brand-red)]/70 transition-all duration-150"
                style={{ width: `${Math.round(overallPct)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {bytesProgress.loaded.toLocaleString()} / {bytesProgress.total.toLocaleString()} בייטים (קובץ נוכחי)
            </p>
          </div>
        )}
        {uploadPhase === "done" && (
          <div className="space-y-3">
            <p className="text-gray-700">כל הקבצים הועלו בהצלחה.</p>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-[var(--brand-red)] text-white font-semibold"
              onClick={() => {
                setUploadOpen(false);
                setUploadPhase("idle");
              }}
            >
              סגור
            </button>
          </div>
        )}
        {uploadPhase === "error" && (
          <div className="space-y-3">
            <p className="text-red-600 text-sm">{uploadError || "שגיאה לא ידועה"}</p>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl border border-gray-300 font-semibold"
              onClick={() => {
                setUploadOpen(false);
                setUploadPhase("idle");
              }}
            >
              סגור
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
