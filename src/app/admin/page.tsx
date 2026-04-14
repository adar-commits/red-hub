"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/announcements");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: "/admin/announcements",
    });
    setPending(false);
    if (res?.error) {
      setError("אימייל או סיסמה שגויים.");
      return;
    }
    if (res?.ok) {
      router.replace("/admin/announcements");
      router.refresh();
    }
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
            כניסה מאובטחת לממשק הניהול. השתמשו באימייל והסיסמה שסופקו על ידי המערכת.
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
          <p className="text-slate-500 text-sm text-center mb-8">אימייל וסיסמה</p>

          <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                אימייל
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c41e3a]/50 focus-visible:border-[#c41e3a]/40"
                placeholder="name@example.com"
                disabled={pending}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                סיסמה
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c41e3a]/50 focus-visible:border-[#c41e3a]/40"
                placeholder="••••••••"
                disabled={pending}
              />
            </div>
            {error ? (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending || !email.trim() || !password}
              className="w-full py-3.5 rounded-xl bg-[#c41e3a] text-white text-sm font-semibold hover:brightness-110 active:scale-[0.99] transition disabled:opacity-45 disabled:pointer-events-none"
            >
              {pending ? "בודקים…" : "כניסה"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
