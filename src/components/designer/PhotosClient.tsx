"use client";

import { useState, useCallback } from "react";

interface PendingFile {
  id: string;
  file: File;
  url: string;
}

export function PhotosClient({ designerCode }: { designerCode: string }) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [projectDescription, setProjectDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lastUploaded, setLastUploaded] = useState<PendingFile[]>([]);

  const removePending = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      next.forEach((p) => URL.revokeObjectURL(p.url));
      return next;
    });
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected?.length) return;
    const newPending: PendingFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (!file.type.startsWith("image/")) continue;
      newPending.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    setPendingFiles((prev) => [...prev, ...newPending]);
    setError("");
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const desc = projectDescription.trim();
    if (!desc) {
      setError("חובה למלא תיאור פרויקט");
      return;
    }
    if (pendingFiles.length === 0) {
      setError("יש לבחור לפחות תמונה אחת");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("projectDescription", desc);
      pendingFiles.forEach((p) => form.append("files", p.file));
      const res = await fetch("/api/photos", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהעלאה");
      setLastUploaded((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [...pendingFiles];
      });
      setPendingFiles([]);
      setProjectDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = projectDescription.trim().length > 0 && pendingFiles.length > 0 && !uploading;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            תיאור פרויקט <span className="text-red-500">*</span>
          </label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="הזן תיאור קצר לפרויקט"
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none resize-y"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">תמונות</label>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-red)] text-white font-medium cursor-pointer hover:bg-[var(--brand-red-hover)] transition-colors focus-within:ring-2 focus-within:ring-[var(--brand-red)]/50">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {uploading ? "מעלה..." : "בחר תמונות"}
          </label>
        </div>

        {pendingFiles.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              תמונות שנבחרו ({pendingFiles.length}) — יש למלא תיאור ולשלוח
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pendingFiles.map((p) => (
                <div
                  key={p.id}
                  className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 group"
                >
                  <img
                    src={p.url}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePending(p.id)}
                    className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold opacity-90 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="הסר"
                  >
                    ×
                  </button>
                  <p className="p-1.5 text-xs text-gray-500 truncate" title={p.file.name}>
                    {p.file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-3 rounded-xl bg-[var(--brand-red)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--brand-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2"
        >
          {uploading ? "שולח..." : "שלח תמונות"}
        </button>
      </form>

      {lastUploaded.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--brand-red)] mb-2">הועלו בהצלחה</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {lastUploaded.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50"
              >
                <img
                  src={p.url}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
                <p className="p-1.5 text-xs text-gray-500 truncate">{p.file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
