"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { AdminProjectPhotoRow } from "@/lib/admin-project-photos";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function designerLabel(photo: AdminProjectPhotoRow): string {
  if (photo.designer_name) {
    return `${photo.designer_name} (${photo.designer_code})`;
  }
  return photo.designer_code;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 break-words">{value}</span>
    </div>
  );
}

export function ProjectPhotosAdminClient({ initialPhotos }: { initialPhotos: AdminProjectPhotoRow[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/project-photos");
      if (!res.ok) return;
      const data = (await res.json()) as { photos?: AdminProjectPhotoRow[] };
      if (data.photos) setPhotos(data.photos);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {photos.length === 0 ? "אין תמונות שהועלו עדיין." : `${photos.length} תמונות`}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? "מרענן…" : "רענון"}
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500 text-sm">
          כשמעצבים יעלו תמונות לפרויקטים, הן יופיעו כאן עם פרטי הפרויקט, המעצב והתאריך.
        </div>
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

              <div className="p-4 flex flex-col gap-3 flex-1">
                <MetaRow label="פרויקט" value={photo.project_name ?? "—"} />
                <MetaRow label="הועלה על ידי" value={designerLabel(photo)} />
                {photo.designer_phone ? (
                  <MetaRow label="טלפון" value={photo.designer_phone} />
                ) : null}
                <MetaRow label="תאריך העלאה" value={formatDateTime(photo.created_at)} />

                <div className="mt-auto pt-2">
                  <a
                    href={photo.download_url}
                    download={photo.filename}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    הורדה
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
