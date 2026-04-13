"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarGreeting } from "./SidebarGreeting";
import { SidebarGlyph, type SidebarGlyphId } from "./SidebarIcons";

const SIDEBAR_COLLAPSED_KEY = "redhub-sidebar-collapsed";

function SidebarCollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  const label = collapsed ? "הרחב תפריט" : "כווץ תפריט";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--sidebar-border)] bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30"
      title={label}
      aria-label={label}
      aria-expanded={!collapsed}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {collapsed ? (
          <>
            <path d="M15 18l-6-6 6-6" />
          </>
        ) : (
          <>
            <path d="M9 18l6-6-6-6" />
          </>
        )}
      </svg>
    </button>
  );
}

function AdminShortcutLink({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/25 ${collapsed ? "justify-center" : "gap-2"}`}
      title="ניהול"
    >
      <SidebarGlyph id="admin" className="h-5 w-5" />
      {!collapsed && <span>ניהול</span>}
    </Link>
  );
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

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
        <div
          className={`border-b border-[var(--sidebar-border)] bg-white/35 p-3 ${
            collapsed ? "flex flex-col items-center gap-2 py-2.5" : "flex items-center gap-2"
          }`}
        >
          <SidebarCollapseToggle collapsed={collapsed} onClick={toggleSidebar} />
          <Link
            href="/dashboard"
            className={`block min-w-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 ${collapsed ? "" : "flex-1 flex justify-center"}`}
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
        <div className="p-2 border-t border-[var(--sidebar-border)] bg-white/20 space-y-0.5">
          <AdminShortcutLink collapsed={collapsed} />
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen flex flex-col bg-[var(--main-shell-bg)] transition-[margin] duration-200 relative ${mainMargin}`}>
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 md:hidden">
          <div className="relative flex items-center justify-center min-h-[3.25rem]">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="absolute start-2 top-1/2 -translate-y-1/2 flex flex-col justify-center gap-[5px] p-2.5 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-slate-200/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/35"
              aria-expanded={mobileMenuOpen}
              aria-controls="designer-mobile-nav"
              aria-label="פתח תפריט"
            >
              <span className="block h-0.5 w-[1.375rem] bg-current rounded-full" aria-hidden />
              <span className="block h-0.5 w-[1.375rem] bg-current rounded-full" aria-hidden />
              <span className="block h-0.5 w-[1.375rem] bg-current rounded-full" aria-hidden />
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 rounded-lg"
              aria-label="HōM GROUP — מסך הבית"
            >
              <Image
                src="/brand/hom-group.png"
                alt=""
                width={440}
                height={176}
                className="h-12 w-auto max-w-[min(240px,72vw)] sm:h-14 sm:max-w-[260px] object-contain object-center"
                priority
              />
            </Link>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 animate-in-fade-up pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </main>

      {/* Mobile slide-out nav */}
      <div className="md:hidden" aria-hidden={!mobileMenuOpen}>
        <button
          type="button"
          aria-label="סגור תפריט"
          tabIndex={mobileMenuOpen ? 0 : -1}
          className={`fixed inset-0 z-40 cursor-default border-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity duration-200 ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          id="designer-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="תפריט ניווט"
          className={`fixed top-0 bottom-0 right-0 z-50 flex w-[min(88vw,300px)] max-w-full flex-col border-s border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[-16px_0_48px_rgba(15,23,42,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--sidebar-border)] bg-white/40 px-3 py-2.5">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 rounded-lg"
              aria-label="HōM GROUP — מסך הבית"
            >
              <Image
                src="/brand/hom-group.png"
                alt=""
                width={440}
                height={176}
                className="h-9 w-auto max-w-[min(200px,48vw)] object-contain object-center"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-white/90 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30"
              aria-label="סגור תפריט"
            >
              <span className="text-2xl font-light leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
          <div className="border-b border-[var(--sidebar-border)] bg-white/25 px-3 py-3 text-sm">
            <SidebarGreeting fullName={fullName} />
            <p className="mt-3 border-t border-[var(--sidebar-border)]/60 pt-3 text-xs leading-relaxed text-[var(--sidebar-text-muted)]">
              קוד המעצב שלך{" "}
              <span className="font-mono font-semibold tabular-nums text-[var(--sidebar-text)]">{designerCode}</span>
            </p>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl border-e-[3px] border-transparent px-3 py-3 text-sm font-medium transition-colors duration-[var(--motion-duration-fast)] ${
                    active
                      ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-md"
                      : "text-slate-800 hover:bg-white/85 hover:text-slate-950"
                  }`}
                >
                  <SidebarGlyph id={item.glyph} className="h-5 w-5 shrink-0" />
                  <span className="leading-snug">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 border-t border-[var(--sidebar-border)] bg-white/25 p-2 space-y-0.5">
            <AdminShortcutLink collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
            <LogoutButton collapsed={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
