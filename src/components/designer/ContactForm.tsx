"use client";

import { useState } from "react";

export function ContactForm({ designerCode }: { designerCode: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error("שגיאה");
      setSent(true);
      setMessage("");
    } catch {
      alert("שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <p className="text-green-600">ההודעה נשלחה. נחזור אליך בהקדם.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הודעה</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
          placeholder="כתוב כאן..."
        />
      </div>
      <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-[var(--brand-red)] text-white font-medium disabled:opacity-60">
        {loading ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
