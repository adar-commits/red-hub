"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarGlyph, type SidebarGlyphId } from "./SidebarIcons";
import { SidebarUserHeadline } from "./SidebarUserHeadline";

/** Compact neutral tile when inactive; active row uses brand red + light icon. */
const NAV_ICON_IDLE =
  "bg-white/80 text-stone-500 border-stone-200/60 shadow-none";
const GLYPH_SM = "h-3.5 w-3.5 shrink-0";
const ICON_TILE = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors";

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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--designer-sidebar-border)] bg-[var(--designer-sidebar-elevated)] text-stone-600 shadow-sm transition-colors hover:border-stone-300 hover:bg-white hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/35"
      title={label}
      aria-label={label}
      aria-expanded={!collapsed}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {collapsed ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
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
      className={`flex items-center w-full px-2.5 py-2 rounded-xl text-sm text-stone-700 hover:bg-white/90 hover:shadow-sm transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/25 ${collapsed ? "justify-center" : "gap-2.5"}`}
      title="ניהול"
    >
      <span className={`${ICON_TILE} ${NAV_ICON_IDLE}`} aria-hidden>
        <SidebarGlyph id="admin" className={GLYPH_SM} />
      </span>
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
      className={`flex items-center w-full px-2.5 py-2 rounded-xl text-sm text-stone-700 hover:bg-white/90 hover:shadow-sm transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/25 ${collapsed ? "justify-center" : "gap-2.5"}`}
      title="התנתק"
    >
      <span className={`${ICON_TILE} ${NAV_ICON_IDLE}`} aria-hidden>
        <SidebarGlyph id="logout" className={GLYPH_SM} />
      </span>
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
        className={`designer-app-sidebar hidden md:flex md:flex-col md:fixed md:inset-y-0 md:rtl:right-0 md:rtl:left-auto bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-[var(--sidebar-border)] border-e shadow-[6px_0_28px_rgba(28,25,23,0.06)] transition-[width] duration-200 ${sidebarW}`}
      >
        {/* flex-row-reverse: collapse control sits on inner (left) edge toward main content */}
        <div
          className={`flex flex-row-reverse items-center gap-2 border-b border-[var(--sidebar-border)] bg-[var(--designer-sidebar-elevated)]/85 p-3 ${
            collapsed ? "py-2.5" : ""
          }`}
        >
          <SidebarCollapseToggle collapsed={collapsed} onClick={toggleSidebar} />
          <Link
            href="/dashboard"
            className={`block min-w-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 ${collapsed ? "" : "flex-1 flex justify-center"}`}
            aria-label="HōM GROUP — מסך הבית"
          >
            <Image
              src="/brand/hom-group.png"
              alt="HōM GROUP"
              width={571}
              height={241}
              className={collapsed ? "h-10 w-auto max-w-[2.75rem] object-contain object-center" : "h-auto w-full max-h-[4.25rem] object-contain object-center"}
              priority
            />
          </Link>
        </div>
        {!collapsed && (
          <div className="px-3 py-3.5 border-b border-[var(--sidebar-border)] bg-[var(--designer-sidebar-surface)]">
            <SidebarUserHeadline fullName={fullName} designerCode={designerCode} />
          </div>
        )}
        {collapsed && (
          <div className="px-2 py-2 border-b border-[var(--sidebar-border)] bg-[var(--designer-sidebar-surface)] text-center">
            <p className="text-[10px] font-mono font-bold tabular-nums text-[var(--brand-red)] truncate" title={designerCode}>
              {designerCode}
            </p>
          </div>
        )}
        <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-[var(--motion-duration-fast)] border-e-[3px] border-transparent ${
                  collapsed ? "justify-center px-0 py-1.5 min-w-[2.25rem]" : "gap-2.5 px-2 py-1.5"
                } ${
                  active
                    ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)] shadow-sm ring-1 ring-black/[0.04]"
                    : "text-stone-800 hover:bg-[var(--designer-sidebar-elevated)] hover:shadow-sm border-transparent"
                }`}
              >
                <span
                  className={`${ICON_TILE} ${
                    active ? "border-white/25 bg-white/15 text-white" : NAV_ICON_IDLE
                  }`}
                  aria-hidden
                >
                  <SidebarGlyph id={item.glyph} className={GLYPH_SM} />
                </span>
                {!collapsed && <span className="leading-snug">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[var(--sidebar-border)] bg-[var(--designer-sidebar-elevated)]/70 space-y-1">
          <AdminShortcutLink collapsed={collapsed} />
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen flex flex-col bg-[var(--main-shell-bg)] transition-[margin] duration-200 relative ${mainMargin}`}>
        <header className="sticky top-0 z-30 border-b border-gray-300 bg-white/98 backdrop-blur-md px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.06)] md:hidden">
          <div className="relative flex min-h-[3rem] items-center justify-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="absolute start-1.5 top-1/2 -translate-y-1/2 flex flex-col justify-center gap-1 rounded-lg p-2 text-slate-800 hover:bg-slate-100 active:bg-slate-200/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/35"
              aria-expanded={mobileMenuOpen}
              aria-controls="designer-mobile-nav"
              aria-label="פתח תפריט"
            >
              <span className="block h-0.5 w-5 rounded-full bg-current" aria-hidden />
              <span className="block h-0.5 w-5 rounded-full bg-current" aria-hidden />
              <span className="block h-0.5 w-5 rounded-full bg-current" aria-hidden />
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30 rounded-lg"
              aria-label="HōM GROUP — מסך הבית"
            >
              <Image
                src="/brand/hom-group.png"
                alt=""
                width={571}
                height={241}
                className="h-10 w-auto max-w-[min(220px,68vw)] object-contain object-center sm:h-12 sm:max-w-[240px]"
                priority
              />
            </Link>
          </div>
        </header>
        <div className="flex-1 animate-in-fade-up px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile slide-out nav */}
      <div className="md:hidden" aria-hidden={!mobileMenuOpen}>
        <button
          type="button"
          aria-label="סגור תפריט"
          tabIndex={mobileMenuOpen ? 0 : -1}
          className={`fixed inset-0 z-40 cursor-default border-0 bg-slate-800/35 backdrop-blur-[3px] transition-opacity duration-200 ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          id="designer-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="תפריט ניווט"
          className={`designer-app-sidebar fixed top-0 bottom-0 right-0 z-50 flex w-[min(88vw,300px)] max-w-full flex-col border-s-2 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[-16px_0_48px_rgba(28,25,23,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
                width={571}
                height={241}
                className="h-9 w-auto max-w-[min(200px,48vw)] object-contain object-center"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300/80 bg-white/80 text-lg text-slate-600 hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/30"
              aria-label="סגור תפריט"
            >
              <span className="font-light leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
          <div className="border-b border-[var(--sidebar-border)] bg-[var(--designer-sidebar-surface)] px-3 py-3.5">
            <SidebarUserHeadline fullName={fullName} designerCode={designerCode} />
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg border-e-[3px] border-transparent px-2 py-1.5 text-sm font-medium transition-all duration-[var(--motion-duration-fast)] ${
                    active
                      ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-sm ring-1 ring-black/[0.04]"
                      : "text-stone-800 hover:bg-[var(--designer-sidebar-elevated)] hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`${ICON_TILE} ${
                      active ? "border-white/25 bg-white/15 text-white" : NAV_ICON_IDLE
                    }`}
                    aria-hidden
                  >
                    <SidebarGlyph id={item.glyph} className={GLYPH_SM} />
                  </span>
                  <span className="leading-snug">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 border-t border-[var(--sidebar-border)] bg-[var(--designer-sidebar-elevated)]/80 p-2 space-y-1">
            <AdminShortcutLink collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
            <LogoutButton collapsed={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
