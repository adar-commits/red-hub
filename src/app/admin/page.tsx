"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/dashboard");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      code: code.trim(),
      redirect: false,
      callbackUrl: "/admin/dashboard",
    });
    setPending(false);
    if (res?.error) {
      setError("קוד שגוי. נסו שוב.");
      return;
    }
    if (res?.ok) {
      router.replace("/admin/dashboard");
      router.refresh();
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600 text-sm">טוען…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-[var(--brand-red)] mb-2">ניהול HōM GROUP</h1>
        <p className="text-gray-600 text-sm mb-6">הזינו את קוד הגישה לניהול</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <label htmlFor="admin-code" className="sr-only">
            קוד גישה
          </label>
          <input
            id="admin-code"
            name="code"
            type="password"
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/40"
            placeholder="קוד גישה"
            disabled={pending}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || !code.trim()}
            className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {pending ? "בודקים…" : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
