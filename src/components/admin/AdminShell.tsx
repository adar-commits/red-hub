"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [{ href: "/admin/announcements", label: "הודעות" }];

const settingsPath = "/admin/settings";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  // Server layout already requires a session; client `email` can be "" so never gate only on email.
  const showSettings = status === "authenticated" && session?.user != null;
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <div
          className="md:hidden flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 bg-white px-4 py-3 text-sm font-medium"
          aria-label="ניווט ניהול"
        >
          <Link
            href="/admin/announcements"
            className={pathname === "/admin/announcements" ? "text-[var(--brand-red)]" : "text-gray-700"}
          >
            הודעות
          </Link>
          {showSettings ? (
            <>
              <Link
                href="/admin/settings/activity"
                className={pathname === "/admin/settings/activity" ? "text-[var(--brand-red)]" : "text-gray-700"}
              >
                מעקב פעילות
              </Link>
              <Link
                href={settingsPath}
                className={isSettings ? "text-[var(--brand-red)]" : "text-gray-700"}
              >
                הגדרות
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="text-gray-500 ms-auto"
          >
            התנתק
          </button>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
