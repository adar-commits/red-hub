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

export function SidebarGreeting({ fullName }: { fullName: string | null }) {
  const text = getTimeGreeting();
  const firstName = getFirstName(fullName);

  return (
    <p className="text-sm font-medium text-[var(--sidebar-text)] leading-relaxed">
      {text}, {firstName}
    </p>
  );
}
