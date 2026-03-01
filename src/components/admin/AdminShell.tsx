"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/dashboard", label: "דשבורד" },
  { href: "/admin/designers", label: "מעצבים" },
  { href: "/admin/announcements", label: "הודעות" },
  { href: "/admin/photos", label: "תמונות" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="hidden md:flex md:w-56 flex-col bg-[var(--sidebar-bg)] text-white">
        <div className="p-4 font-bold">Red Hub Admin</div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm ${pathname === item.href ? "bg-[var(--brand-red)]" : "hover:bg-white/10"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="w-full text-right px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg"
          >
            התנתק
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
