"use client";

import { useState } from "react";

const WHATSAPP_CONTACT_URL =
  "https://wa.me/972539192021?text=%D7%94%D7%99%D7%99%20%D7%90%D7%A0%D7%99%20%D7%A6%D7%A8%D7%99%D7%9B/%D7%94%20%D7%A1%D7%99%D7%95%D7%A2,%20%D7%94%D7%92%D7%A2%D7%AA%D7%99%20%D7%9E%D7%94-RED%20HUB";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ContactForm({ designerCode: _designerCode }: { designerCode: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("שגיאה");
      setSent(true);
      setSubject("");
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
    <div className="max-w-xl space-y-5">
      <p className="text-sm leading-relaxed text-gray-700">
        נשמח לשמוע מכם, ניתן לדבר איתנו גם באמצעות ה־WhatsApp{" "}
        <WhatsAppIcon
          className="inline-block h-[1.1em] w-[1.1em] align-[-0.2em] text-[#25D366]"
          aria-hidden
        />{" "}
        ב
        <a
          href={WHATSAPP_CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-0.5 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
        >
          קישור הבא
        </a>
        .
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-gray-700">
            נושא
          </label>
          <input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-colors placeholder:text-slate-600 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20"
            placeholder="נושא הפנייה"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-gray-700">
            הודעה
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition-colors placeholder:text-slate-600 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20"
            placeholder="כתוב כאן..."
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--brand-red)] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[var(--brand-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "שולח..." : "שליחה"}
        </button>
      </form>
    </div>
  );
}
