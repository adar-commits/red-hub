"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!terms) {
      setError("יש לאשר את תקנון המסחר והשימוש");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, termsAccepted: terms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה");
        return;
      }
      if (data.commissions) {
        sessionStorage.setItem("commissions", JSON.stringify(data.commissions));
      }
      window.location.href = `/verify?phone=${encodeURIComponent(phone)}`;
    } catch {
      setError("שגיאה בחיבור");
    } finally {
      setLoading(false);
    }
  }

  const bgUrl =
    "https://cdn.shopify.com/s/files/1/0594/9839/7887/files/bg.jpg?v=1772573122";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-100">
      {/* Background image as element so it loads reliably */}
      <img
        src={bgUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl p-8 animate-in-fade-up">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 px-4" aria-live="polite" aria-busy="true">
            <div
              className="w-12 h-12 rounded-full border-2 border-[var(--brand-red)]/30 border-t-[var(--brand-red)] animate-spin"
              style={{ animationDuration: "var(--motion-duration-slow, 0.8s)" }}
              aria-hidden
            />
            <p className="mt-5 text-lg font-semibold text-[var(--brand-red)]">
              מאמתים ומכינים את הנתונים...
            </p>
            <p className="mt-2 text-sm text-gray-500 text-center">
              נשלח אליך קוד ב-WhatsApp בעוד רגע
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[var(--brand-red)] text-center mb-1">
              ברוכים הבאים לפורטל
            </h1>
            <h2 className="text-xl font-bold text-[var(--brand-red)] text-center mb-4">
              אדריכלים ומעצבים
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              יש לבצע התחברות למערכת
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  טלפון *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none transition-colors"
                  required
                  dir="ltr"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-[var(--brand-red)] focus:ring-[var(--brand-red)]"
                />
                <span className="text-sm text-gray-700">
                  אני מאשר/ת שקראתי את{" "}
                  <a href="/terms" className="text-blue-600 underline">תקנון המסחר והשימוש</a>
                </span>
              </label>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold text-lg hover:bg-[var(--brand-red-hover)] disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 active:scale-[0.99]"
              >
                שלח קוד
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
