"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const ssoConfigured =
    typeof process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === "string" &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length > 0;

  useEffect(() => {
    const q = searchParams.get("error");
    if (q === "AccessDenied") {
      setError("אין הרשאה: המייל לא רשום כמנהל במערכת.");
    }
    if (q === "Configuration") {
      setError("שגיאת הגדרות SSO — בדקו משתני סביבה בשרת.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/announcements");
    }
  }, [status, router]);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);
    await signIn("google", {
      callbackUrl: "/admin/announcements",
      redirect: true,
    });
    setPending(false);
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419] p-4">
        <p className="text-slate-400 text-sm">טוען…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f1419]">
      <div className="relative flex-1 flex flex-col justify-center px-8 py-14 lg:px-16 lg:py-20 border-b lg:border-b-0 lg:border-e border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #c41e3a 0%, transparent 45%), radial-gradient(circle at 80% 60%, #1e3a5f 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c41e3a] mb-4">HōM GROUP</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            פורטל ניהול
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            כניסה לממשק הניהול באמצעות Google — רק למיילים הרשומים במערכת (מסד הנתונים).
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-[#121922]">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161d27] shadow-2xl shadow-black/40 p-8 sm:p-10">
          <div className="flex justify-center mb-8">
            <Image
              src="/brand/hom-group.png"
              alt="HōM GROUP"
              width={280}
              height={118}
              className="h-10 w-auto object-contain opacity-95"
            />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-1">כניסת מנהלים</h2>
          <p className="text-slate-500 text-sm text-center mb-8">Google (SSO)</p>

          {!ssoConfigured ? (
            <p className="text-sm text-amber-400/95 bg-amber-950/40 border border-amber-900/50 rounded-xl px-4 py-3 text-center leading-relaxed mb-4">
              SSO לא מוגדר בשרת: הגדרו GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ו-NEXT_PUBLIC_GOOGLE_CLIENT_ID (אותו מזהה כמו אצל Google Cloud).
            </p>
          ) : null}

          {error ? (
            <p
              className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 mb-4 text-center"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={pending || !ssoConfigured}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-[#161d27] text-sm font-semibold hover:bg-slate-100 active:scale-[0.99] transition disabled:opacity-45 disabled:pointer-events-none"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {pending ? "מפנים ל-Google…" : "המשך עם Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f1419] p-4">
          <p className="text-slate-400 text-sm">טוען…</p>
        </div>
      }
    >
      <AdminLoginInner />
    </Suspense>
  );
}
