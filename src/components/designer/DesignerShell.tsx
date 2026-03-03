"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      התנתק
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--background)]">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:rtl:right-0 md:rtl:left-auto bg-[var(--sidebar-bg)] text-white shadow-[2px_0_12px_rgba(0,0,0,0.08)]">
        <div className="p-4 border-b border-white/10">
          <div className="font-bold text-lg">השטיח האדום</div>
          <div className="text-sm text-white/80 mt-1">Red Hub</div>
        </div>
        <div className="p-3 text-sm text-white/90">
          <p>שלום {fullName || "מעצב/ת"}</p>
          <p className="text-white/70">קוד המעצב שלך {designerCode}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-[var(--motion-duration-fast)] border-r-2 border-transparent ${
                  active
                    ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)]"
                    : "text-white/90 hover:bg-white/10 border-transparent"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 md:rtl:ml-0 md:rtl:mr-64 min-h-screen flex flex-col pb-20 md:pb-0 bg-gray-50/80">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
          <span className="font-semibold text-[var(--brand-red)]">Red Hub</span>
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
