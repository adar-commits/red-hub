"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { isAdminSettingsUser } from "@/lib/admin-settings-access";

const navItems = [{ href: "/admin/announcements", label: "הודעות" }];

const settingsPath = "/admin/settings";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const showSettings = isAdminSettingsUser(session?.user?.email);
  const isSettings = pathname?.startsWith(settingsPath);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="hidden md:flex md:w-56 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-e border-[var(--sidebar-border)] shadow-[2px_0_24px_rgba(15,23,42,0.06)]">
        <div className="p-4 border-b border-[var(--sidebar-border)]">
          <Link href="/admin/announcements" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 rounded-lg">
            <Image
              src="/brand/hom-group.png"
              alt="HōM GROUP"
              width={571}
              height={241}
              className="h-auto w-full max-h-[3.25rem] object-contain object-center"
            />
          </Link>
          <p className="text-xs text-[var(--sidebar-text-muted)] mt-2 font-medium">ניהול</p>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-[var(--brand-red)] text-white shadow-sm"
                  : "text-[var(--sidebar-text)] hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {showSettings ? (
            <Link
              href="/admin/settings/activity"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/admin/settings/activity"
                  ? "bg-[var(--brand-red)] text-white shadow-sm"
                  : "text-[var(--sidebar-text)] hover:bg-gray-100"
              }`}
            >
              מעקב פעילות
            </Link>
          ) : null}
        </nav>
        <div className="mt-auto p-2 border-t border-[var(--sidebar-border)] pt-2 space-y-1">
          {showSettings ? (
            <Link
              href={settingsPath}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSettings ? "bg-gray-100 text-[var(--sidebar-text)]" : "text-[var(--sidebar-text)] hover:bg-gray-100"
              }`}
              aria-label="הגדרות"
            >
              <span className="text-lg" aria-hidden>
                ⚙️
              </span>
              <span>הגדרות</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="w-full text-right px-3 py-2 text-sm text-[var(--sidebar-text-muted)] hover:bg-gray-100 rounded-lg transition-colors"
          >
            התנתק
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
