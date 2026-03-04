"use client";

import { useState, useEffect } from "react";
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
      className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${collapsed ? "justify-center" : "gap-2"}`}
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
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:rtl:right-0 md:rtl:left-auto bg-[var(--sidebar-bg)] text-white shadow-[2px_0_12px_rgba(0,0,0,0.08)] transition-[width] duration-200 ${sidebarW}`}
      >
        <div className={`p-3 border-b border-white/10 flex items-center ${collapsed ? "flex-col gap-1" : "flex-row flex-wrap"}`}>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={collapsed ? "הרחב תפריט" : "כווץ תפריט"}
            aria-label={collapsed ? "הרחב תפריט" : "כווץ תפריט"}
          >
            <span className="inline-block transition-transform duration-200" style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>
              ◀
            </span>
          </button>
          {!collapsed && (
            <>
              <div className="font-bold text-lg leading-tight w-full">
                <span className="text-[var(--brand-red)]">DESIGNERS</span>{" "}
                <span className="text-white">RedHub</span>
              </div>
              <div className="text-xs text-white/70 mt-1 w-full">version 4.2.1</div>
            </>
          )}
        </div>
        {!collapsed && (
          <div className="p-3 text-sm border-b border-white/10">
            <SidebarGreeting fullName={fullName} />
            <p className="text-white/70 mt-4">קוד המעצב שלך {designerCode}</p>
          </div>
        )}
        {collapsed && (
          <div className="px-2 py-1 border-b border-white/10 text-center">
            <p className="text-white/70 text-xs truncate" title={`קוד ${designerCode}`}>
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
                className={`flex items-center rounded-lg text-sm font-medium transition-colors duration-[var(--motion-duration-fast)] border-r-2 border-transparent ${
                  collapsed ? "justify-center px-0 py-2.5 min-w-[2.5rem]" : "gap-2 px-3 py-2.5"
                } ${
                  active
                    ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)]"
                    : "text-white/90 hover:bg-white/10 border-transparent"
                }`}
              >
                <span>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/10">
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen flex flex-col pb-20 md:pb-0 bg-gray-50/80 transition-[margin] duration-200 ${mainMargin}`}>
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
          <span className="font-semibold">
            <span className="text-[var(--brand-red)]">DESIGNERS</span>{" "}
            <span className="text-gray-900">RedHub</span>
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell designerCode={designerCode} />
            <span className="text-sm text-gray-600">קוד {designerCode}</span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 animate-in-fade-up">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--sidebar-bg)] text-white border-t border-white/10 safe-area-pb flex justify-around py-2 active:bg-white/5">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center ${pathname === "/dashboard" ? "text-[var(--brand-red)]" : "text-white/80"}`}
        >
          <span>🏠</span>
          <span>בית</span>
        </Link>
        <Link
          href="/deals"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center ${pathname === "/deals" ? "text-[var(--brand-red)]" : "text-white/80"}`}
        >
          <span>🤝</span>
          <span>עסקאות</span>
        </Link>
        <Link
          href="/commissions"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center ${pathname === "/commissions" ? "text-[var(--brand-red)]" : "text-white/80"}`}
        >
          <span>💰</span>
          <span>עמלות</span>
        </Link>
        <Link
          href="/business"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors duration-[var(--motion-duration-fast)] rounded-lg min-h-[44px] justify-center ${pathname === "/business" ? "text-[var(--brand-red)]" : "text-white/80"}`}
        >
          <span>📋</span>
          <span>פרטים</span>
        </Link>
      </nav>
    </div>
  );
}
