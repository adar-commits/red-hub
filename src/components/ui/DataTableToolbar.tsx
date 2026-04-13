"use client";

function ExportDownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
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

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  onExportCsv,
  searchPlaceholder = "חיפוש...",
  exportLabel = "ייצוא CSV",
  className,
  dir: dirProp,
  /** When true: single row with icon-only export on small screens (physical left under RTL). */
  compactExportOnNarrow = false,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExportCsv: () => void;
  searchPlaceholder?: string;
  exportLabel?: string;
  className?: string;
  dir?: "rtl" | "ltr";
  compactExportOnNarrow?: boolean;
}) {
  const exportBtnClass = compactExportOnNarrow
    ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-gray-400 bg-white text-gray-950 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/25 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
    : "w-full min-h-[44px] shrink-0 rounded-lg border-2 border-gray-400 bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/25 sm:w-auto";

  return (
    <div
      className={
        compactExportOnNarrow
          ? `mb-4 flex flex-row flex-wrap items-center gap-2 ${className ?? ""}`
          : `mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className ?? ""}`
      }
      dir={dirProp}
    >
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className={`min-h-[44px] w-full rounded-lg border-2 border-gray-400 bg-white px-4 py-2.5 text-sm text-gray-950 placeholder:text-[color:var(--input-placeholder)] transition-colors focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/25 focus:outline-none ${
          compactExportOnNarrow ? "min-w-0 flex-1" : "sm:min-w-[200px] sm:flex-1"
        } ${dirProp === "rtl" ? "text-right" : ""}`}
        aria-label={searchPlaceholder}
      />
      <button
        type="button"
        onClick={onExportCsv}
        className={exportBtnClass}
        aria-label={exportLabel}
        title={exportLabel}
      >
        {compactExportOnNarrow ? (
          <>
            <span className="sm:hidden">
              <ExportDownloadIcon className="text-gray-800" />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">{exportLabel}</span>
          </>
        ) : (
          exportLabel
        )}
      </button>
    </div>
  );
}
