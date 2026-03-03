"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const RESEND_COOLDOWN_SEC = 60;

function VerifyForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSecs, setResendSecs] = useState(0);

  useEffect(() => {
    setResendSecs(RESEND_COOLDOWN_SEC);
  }, []);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone) {
      setError("חסר טלפון. חזור לדף ההתחברות.");
      return;
    }
    if (code.length !== 5) {
      setError("יש להזין 5 ספרות");
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8 animate-in-fade-up">
        <h1 className="text-2xl font-bold text-center mb-1 text-foreground">
          אימות קוד
        </h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          נשלחה אליך הודעת WhatsApp עם קוד. הזן/י את הקוד להמשך.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="phone" value={phone} />
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              קוד
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="00000"
              className="w-full rounded-lg border-2 border-[var(--brand-red)]/30 px-4 py-3 text-xl text-center tracking-[0.4em] focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 outline-none"
              dir="ltr"
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold text-lg hover:bg-[var(--brand-red-hover)] disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            {loading ? "מאמת..." : "אשר קוד"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          לא קיבלת קוד?{" "}
          {resendSecs > 0 ? (
            <span>שלח מחדש בעוד {resendSecs} שניות</span>
          ) : (
            <Link href="/" className="text-[var(--brand-red)] underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-1 rounded">
              שלח מחדש
            </Link>
          )}
        </p>

        <p className="text-center text-sm text-gray-500 mt-2">
          <Link href="/" className="text-[var(--brand-red)] underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-1 rounded">
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
