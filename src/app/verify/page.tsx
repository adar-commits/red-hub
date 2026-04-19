"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { normalizeIsraeliPhone } from "@/lib/phone";

const RESEND_COOLDOWN_SEC = 60;

const VERIFY_BG_URL =
  "https://cdn.shopify.com/s/files/1/0594/9839/7887/files/bg.jpg?v=1772573122";

function VerifyForm() {
  const searchParams = useSearchParams();
  const phone = normalizeIsraeliPhone(searchParams.get("phone") || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSecs, setResendSecs] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResendSecs(RESEND_COOLDOWN_SEC);
  }, []);

  useEffect(() => {
    const el = codeInputRef.current;
    if (!el) return;
    const t = requestAnimationFrame(() => {
      el.focus();
      el.select?.();
    });
    return () => cancelAnimationFrame(t);
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
    if (code.length !== 4) {
      setError("יש להזין 4 ספרות");
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-100 via-neutral-50 to-stone-100 p-4">
      <img
        src={VERIFY_BG_URL}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/45 md:from-black/45 md:via-black/35 md:to-black/50"
        aria-hidden
      />
      <div className="animate-in-fade-up relative z-10 w-full max-w-md rounded-2xl border border-gray-200/80 bg-white/95 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-[2px] md:border-white/20 md:shadow-2xl">
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
              ref={codeInputRef}
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              className="w-full rounded-lg border-2 border-gray-400 px-4 py-3 text-xl text-center tracking-[0.4em] text-gray-950 placeholder:text-[color:var(--input-placeholder)] focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/25 outline-none bg-white"
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
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-100 via-neutral-50 to-stone-100 p-6">
          <img
            src={VERIFY_BG_URL}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-90"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/40" aria-hidden />
          <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-gray-300/90 bg-white/95 px-8 py-6 shadow-[var(--shadow-card)] backdrop-blur-[2px]">
            <div
              className="h-9 w-9 rounded-full border-2 border-[var(--brand-red)]/30 border-t-[var(--brand-red)] animate-spin"
              style={{ animationDuration: "var(--motion-duration-slow, 0.8s)" }}
              aria-hidden
            />
            <p className="text-sm font-medium text-gray-700">טוען…</p>
          </div>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
