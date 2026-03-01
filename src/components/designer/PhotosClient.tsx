"use client";

import { useEffect, useState } from "react";

interface PhotoRow {
  id: string;
  image_url: string;
  description: string | null;
  created_at: string;
}

export function PhotosClient({ designerCode }: { designerCode: string }) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((d) => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/photos", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setPhotos((prev) => [data, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand-red)] text-white font-medium cursor-pointer">
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        {uploading ? "מעלה..." : "העלאת תמונה"}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            <img src={p.image_url} alt={p.description ?? ""} className="w-full aspect-square object-cover" />
            {p.description && <p className="p-2 text-sm text-gray-600">{p.description}</p>}
          </div>
        ))}
      </div>
      {photos.length === 0 && <p className="text-gray-500">אין תמונות</p>}
    </div>
  );
}
