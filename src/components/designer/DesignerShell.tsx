"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { SidebarGreeting } from "./SidebarGreeting";

const SIDEBAR_COLLAPSED_KEY = "redhub-sidebar-collapsed";

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-[var(--sidebar-text-muted)] hover:bg-gray-100 transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/25 ${collapsed ? "justify-center" : "gap-2"}`}
      title="התנתק"
    >
      <span aria-hidden>🚪</span>
      {!collapsed && <span>התנתק</span>}
    </button>
  );
}

const navItems = [
  { href: "/dashboard", label: "מסך הבית", icon: "🏠" },
  { href: "/deals", label: "העסקאות שלי", icon: "🤝" },
  { href: "/commissions", label: "תעודות עמלה", icon: "💰" },
  { href: "/business", label: "פרטי העסק", icon: "📋" },
  { href: "/photos", label: "תמונות פרויקט", icon: "🖼️" },
  { href: "/faq", label: "הדרכה + שאלות ותשובות", icon: "📖" },
  { href: "/contact", label: "כתבו לנו", icon: "💬" },
];

export function DesignerShell({
  children,
  designerCode,
  fullName,
}: {
  children: React.ReactNode;
  designerCode: string;
  fullName: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) setCollapsed(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const sidebarW = collapsed ? "md:w-16" : "md:w-64";
  const mainMargin = collapsed ? "md:ml-16 md:rtl:ml-0 md:rtl:mr-16" : "md:ml-64 md:rtl:ml-0 md:rtl:mr-64";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)]">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:rtl:right-0 md:rtl:left-auto bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-[var(--sidebar-border)] border-e shadow-[2px_0_24px_rgba(15,23,42,0.06)] transition-[width] duration-200 ${sidebarW}`}
      >
        <div className={`p-3 border-b border-[var(--sidebar-border)] ${collapsed ? "flex justify-center py-2" : ""}`}>
          <Link
            href="/dashboard"
            className={`block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 ${collapsed ? "" : "mx-auto max-w-[220px]"}`}
            aria-label="HōM GROUP — מסך הבית"
          >
            <Image
              src="/brand/hom-group.png"
              alt="HōM GROUP"
              width={440}
              height={220}
              className={collapsed ? "h-10 w-auto max-w-[2.75rem] object-contain object-center" : "h-auto w-full max-h-[4.5rem] object-contain object-center"}
              priority
            />
          </Link>
        </div>
        {!collapsed && (
          <div className="p-3 text-sm border-b border-[var(--sidebar-border)]">
            <SidebarGreeting fullName={fullName} />
            <p className="text-[var(--sidebar-text-muted)] mt-4">קוד המעצב שלך {designerCode}</p>
          </div>
        )}
        {collapsed && (
          <div className="px-2 py-1 border-b border-[var(--sidebar-border)] text-center">
            <p className="text-[var(--sidebar-text-muted)] text-xs truncate" title={`קוד ${designerCode}`}>
              {designerCode}
            </p>
          </div>
        )}
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center rounded-lg text-sm font-medium transition-colors duration-[var(--motion-duration-fast)] border-e-2 border-transparent ${
                  collapsed ? "justify-center px-0 py-2.5 min-w-[2.5rem]" : "gap-2 px-3 py-2.5"
                } ${
                  active
                    ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)] shadow-sm"
                    : "text-[var(--sidebar-text)] hover:bg-gray-100 border-transparent"
                }`}
              >
                <span>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[var(--sidebar-border)]">
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen flex flex-col pb-20 md:pb-0 bg-gray-50/80 transition-[margin] duration-200 relative ${mainMargin}`}>
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex fixed left-0 top-4 z-20 flex-col gap-1 p-2 rounded-r-lg bg-white border border-[var(--sidebar-border)] text-gray-700 hover:bg-gray-50 shadow-md"
          title={collapsed ? "הרחב תפריט" : "כווץ תפריט"}
          aria-label={collapsed ? "הרחב תפריט" : "כווץ תפריט"}
        >
          <span className="w-5 h-0.5 bg-gray-600 rounded" aria-hidden />
          <span className="w-5 h-0.5 bg-gray-600 rounded" aria-hidden />
          <span className="w-5 h-0.5 bg-gray-600 rounded" aria-hidden />
        </button>
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2.5 flex items-center justify-between md:hidden">
          <Link href="/dashboard" className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 rounded-md" aria-label="HōM GROUP">
            <Image
              src="/brand/hom-group.png"
              alt=""
              width={200}
              height={80}
              className="h-9 w-auto max-w-[140px] object-contain object-right"
            />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell designerCode={designerCode} />
            <span className="text-sm text-gray-600">קוד {designerCode}</span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 animate-in-fade-up">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--sidebar-border)] safe-area-pb flex justify-around py-1.5 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center font-medium ${pathname === "/dashboard" ? "text-[var(--brand-red)]" : "text-gray-600"}`}
        >
          <span>🏠</span>
          <span>בית</span>
        </Link>
        <Link
          href="/deals"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center font-medium ${pathname === "/deals" ? "text-[var(--brand-red)]" : "text-gray-600"}`}
        >
          <span>🤝</span>
          <span>עסקאות</span>
        </Link>
        <Link
          href="/commissions"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center font-medium ${pathname === "/commissions" ? "text-[var(--brand-red)]" : "text-gray-600"}`}
        >
          <span>💰</span>
          <span>עמלות</span>
        </Link>
        <Link
          href="/business"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center font-medium ${pathname === "/business" ? "text-[var(--brand-red)]" : "text-gray-600"}`}
        >
          <span>📋</span>
          <span>פרטים</span>
        </Link>
      </nav>
    </div>
  );
}
