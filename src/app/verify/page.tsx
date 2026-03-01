"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyForm() {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "";
  const [phone, setPhone] = useState(phoneParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhone(phoneParam);
  }, [phoneParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || code.length !== 6) {
      setError("יש להזין טלפון ו־6 ספרות");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("שגיאה בחיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <h1 className="text-2xl font-bold text-[var(--brand-red)] text-center mb-1">
          אימות קוד
        </h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          הזן את הקוד שנשלח אליך בוואטסאפ
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              טלפון
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] outline-none"
              required
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              קוד (6 ספרות)
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-xl text-center tracking-widest focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)] outline-none"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold text-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading ? "מאמת..." : "אימות"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/" className="text-[var(--brand-red)] underline">
            חזרה להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
