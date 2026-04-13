import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-300 bg-[var(--card-bg)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow duration-200 hover:shadow-md"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <div
        className="pointer-events-none absolute -start-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-gray-100/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-700">{title}</p>
          <p className="mt-1.5 text-lg font-bold leading-tight text-gray-950 tabular-nums">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
