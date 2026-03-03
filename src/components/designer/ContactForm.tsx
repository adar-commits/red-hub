"use client";

import { useState } from "react";

export function ContactForm({ designerCode }: { designerCode: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setError("");
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
      setError("שגיאה בשליחה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-green-600 font-medium animate-in-fade-up">
        ההודעה נשלחה. נחזור אליך בהקדם.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
          הודעה
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors placeholder:text-gray-400"
          placeholder="כתוב כאן..."
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 rounded-lg bg-[var(--brand-red)] text-white font-medium hover:bg-[var(--brand-red-hover)] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 transition-colors active:scale-[0.99]"
      >
        {loading ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
