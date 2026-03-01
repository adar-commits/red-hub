"use client";

import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-[var(--brand-red)] mb-2">ניהול Red Hub</h1>
        <p className="text-gray-600 text-sm mb-6">התחברות עם Google</p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/admin/dashboard" })}
          className="w-full py-3 rounded-lg bg-[var(--brand-red)] text-white font-semibold hover:opacity-90"
        >
          התחברות עם Google
        </button>
      </div>
    </div>
  );
}
