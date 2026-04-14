"use client";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 21) return "אחר צהריים טובים";
  return "ערב טוב";
}

function getFirstName(fullName: string | null): string {
  if (!fullName?.trim()) return "מעצב/ת";
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** One line: greeting + name + designer code (RTL). */
export function SidebarUserHeadline({
  fullName,
  designerCode,
  compact = false,
}: {
  fullName: string | null;
  designerCode: string;
  compact?: boolean;
}) {
  const greeting = getTimeGreeting();
  const firstName = getFirstName(fullName);

  return (
    <p
      className={`leading-snug text-[var(--designer-sidebar-headline)] ${
        compact ? "text-xs font-medium" : "text-sm font-semibold"
      }`}
    >
      <span className="text-[var(--designer-sidebar-headline-soft)] font-medium">
        {greeting}, {firstName}
      </span>
      <span className="mx-1 text-[var(--designer-sidebar-divider)]" aria-hidden>
        ·
      </span>
      <span className="text-[var(--designer-sidebar-headline)]">קוד מעצב:</span>{" "}
      <span className="font-mono font-bold tabular-nums text-[var(--brand-red)] tracking-tight">
        {designerCode}
      </span>
    </p>
  );
}
