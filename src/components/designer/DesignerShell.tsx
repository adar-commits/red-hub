"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { SidebarGreeting } from "./SidebarGreeting";
import { SidebarGlyph, type SidebarGlyphId } from "./SidebarIcons";

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
      className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/25 ${collapsed ? "justify-center" : "gap-2"}`}
      title="התנתק"
    >
      <SidebarGlyph id="logout" className="h-5 w-5" />
      {!collapsed && <span>התנתק</span>}
    </button>
  );
}

const navItems: { href: string; label: string; glyph: SidebarGlyphId }[] = [
  { href: "/dashboard", label: "מסך הבית", glyph: "home" },
  { href: "/deals", label: "העסקאות שלי", glyph: "deals" },
  { href: "/commissions", label: "תעודות עמלה", glyph: "commissions" },
  { href: "/business", label: "פרטי העסק", glyph: "business" },
  { href: "/photos", label: "תמונות פרויקט", glyph: "photos" },
  { href: "/faq", label: "הדרכה + שאלות ותשובות", glyph: "faq" },
  { href: "/contact", label: "כתבו לנו", glyph: "contact" },
];

const mobileNavItems: { href: string; label: string; glyph: SidebarGlyphId }[] = [
  { href: "/dashboard", label: "בית", glyph: "home" },
  { href: "/deals", label: "עסקאות", glyph: "deals" },
  { href: "/commissions", label: "עמלות", glyph: "commissions" },
  { href: "/business", label: "פרטים", glyph: "business" },
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--main-shell-bg)]">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:rtl:right-0 md:rtl:left-auto bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-[var(--sidebar-border)] border-e shadow-[4px_0_32px_rgba(15,23,42,0.08)] transition-[width] duration-200 ${sidebarW}`}
      >
        <div className={`p-3 border-b border-[var(--sidebar-border)] bg-white/35 ${collapsed ? "flex justify-center py-2" : ""}`}>
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
          <div className="p-3 text-sm border-b border-[var(--sidebar-border)] bg-white/25">
            <SidebarGreeting fullName={fullName} />
            <p className="text-[var(--sidebar-text-muted)] mt-3 text-xs leading-relaxed border-t border-[var(--sidebar-border)]/60 pt-3">
              קוד המעצב שלך <span className="font-mono font-semibold text-[var(--sidebar-text)] tabular-nums">{designerCode}</span>
            </p>
          </div>
        )}
        {collapsed && (
          <div className="px-2 py-1 border-b border-[var(--sidebar-border)] text-center">
            <p className="text-[var(--sidebar-text-muted)] text-xs truncate" title={`קוד ${designerCode}`}>
              {designerCode}
            </p>
          </div>
        )}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center rounded-lg text-sm font-medium transition-colors duration-[var(--motion-duration-fast)] border-e-[3px] border-transparent ${
                  collapsed ? "justify-center px-0 py-2.5 min-w-[2.5rem]" : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)] shadow-md"
                    : "text-slate-800 hover:bg-white/80 hover:text-slate-950 border-transparent"
                }`}
              >
                <SidebarGlyph id={item.glyph} className="h-5 w-5" />
                {!collapsed && <span className="leading-snug">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[var(--sidebar-border)] bg-white/20">
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen flex flex-col pb-20 md:pb-0 bg-[var(--main-shell-bg)] transition-[margin] duration-200 relative ${mainMargin}`}>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--sidebar-bg)] border-t border-[var(--sidebar-border)] safe-area-pb flex justify-around py-1.5 shadow-[0_-6px_28px_rgba(15,23,42,0.1)]">
        {mobileNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] transition-colors duration-[var(--motion-duration-fast)] rounded-xl min-h-[48px] min-w-[3.25rem] justify-center font-semibold ${
                active ? "text-[var(--brand-red)]" : "text-slate-600"
              }`}
            >
              <SidebarGlyph id={item.glyph} className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
