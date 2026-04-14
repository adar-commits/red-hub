"use client";

function ExportDownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/** CSV export — kept compact for mobile; sits on the physical start (left) of the title row under RTL. */
export function ExportCsvButton({
  onClick,
  label,
  className = "",
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-400 bg-white px-2.5 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/25 sm:h-10 sm:px-3 sm:text-sm ${className}`}
      aria-label={label}
      title={label}
    >
      <ExportDownloadIcon className="h-[1.05rem] w-[1.05rem] shrink-0 text-emerald-600/90" />
      {label}
    </button>
  );
}
