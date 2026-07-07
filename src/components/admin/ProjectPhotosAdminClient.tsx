"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { isProbablyImageFile, PROJECT_PHOTO_MAX_FILE_BYTES } from "@/lib/designer-project-photos-shared";

export type AdminProjectPhoto = {
  id: string;
  url: string | null;
  storage_path: string;
  designer_code: string;
  project_id: string;
  project_name: string | null;
  description: string | null;
  created_at: string;
};

export type AdminProjectOption = {
  id: string;
  designer_code: string;
  project_name: string;
  created_at: string;
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ProjectPhotosAdminClient({
  initialPhotos,
  initialProjects,
}: {
  initialPhotos: AdminProjectPhoto[];
  initialProjects: AdminProjectOption[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [projects] = useState(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjects[0]?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/project-photos");
    if (!res.ok) return;
    const data = (await res.json()) as { photos?: AdminProjectPhoto[] };
    if (data.photos) setPhotos(data.photos);
  }, []);

  const handleUpload = useCallback(async () => {
    const file = fileRef.current?.files?.[0];
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedProjectId) {
      setUploadError("יש לבחור פרויקט");
      return;
    }
    if (!file) {
      setUploadError("יש לבחור קובץ תמונה");
      return;
    }
    if (!isProbablyImageFile(file)) {
      setUploadError("קובץ לא נתמך — יש לבחור תמונה");
      return;
    }
    if (file.size > PROJECT_PHOTO_MAX_FILE_BYTES) {
      setUploadError("הקובץ גדול מדי (מקסימום 12MB)");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("projectId", selectedProjectId);
      form.append("file", file);
      const res = await fetch("/api/admin/project-photos", { method: "POST", body: form });
      const data = (await res.json()) as AdminProjectPhoto & { error?: string; detail?: string };
      if (!res.ok) {
        setUploadError(data.detail ? `${data.error ?? "שגיאה"}: ${data.detail}` : (data.error ?? "העלאה נכשלה"));
        return;
      }
      const project = projects.find((p) => p.id === selectedProjectId);
      const newPhoto: AdminProjectPhoto = {
        id: data.id,
        url: data.url,
        storage_path: data.storage_path,
        designer_code: data.designer_code,
        project_id: data.project_id,
        project_name: project?.project_name ?? null,
        description: data.description,
        created_at: data.created_at,
      };
      setPhotos((prev) => [newPhoto, ...prev]);
      setUploadSuccess("התמונה הועלתה בהצלחה");
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } catch {
      setUploadError("שגיאת רשת");
    } finally {
      setUploading(false);
    }
  }, [projects, refresh, selectedProjectId]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">העלאת בדיקה</h2>
        <p className="text-sm text-gray-600">
          {photos.length === 0
            ? "אין תמונות במערכת. נסו להעלות תמונת בדיקה לפרויקט קיים כדי לוודא שהאחסון עובד."
            : `${photos.length} תמונות במערכת.`}
        </p>
        {projects.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            אין פרויקטים במערכת — מעצב צריך ליצור פרויקט לפני העלאת תמונות.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">פרויקט</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 min-w-[14rem] bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name} ({p.designer_code})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">קובץ תמונה</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="text-sm file:me-2 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={uploading}
              className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "מעלה…" : "העלה תמונת בדיקה"}
            </button>
          </div>
        )}
        {uploadError ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
        ) : null}
        {uploadSuccess ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {uploadSuccess}
          </p>
        ) : null}
      </div>

      {photos.length === 0 ? (
        <p className="text-gray-500 text-sm">אין תמונות להצגה.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => (
            <article
              key={photo.id}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                {photo.url ? (
                  <Image
                    src={photo.url}
                    alt={photo.project_name ?? "תמונת פרויקט"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                    אין תצוגה מקדימה
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1 text-sm">
                <p className="font-medium text-gray-900">{photo.project_name ?? "—"}</p>
                <p className="text-gray-600">מעצב: {photo.designer_code}</p>
                <p className="text-gray-500 text-xs">{formatDateTime(photo.created_at)}</p>
                {photo.description ? <p className="text-gray-600 text-xs">{photo.description}</p> : null}
                <p className="text-gray-400 text-xs break-all font-mono">{photo.storage_path}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
