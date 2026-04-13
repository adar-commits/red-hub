"use client";

import type { ReactNode } from "react";

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

const inputClassBase =
  "min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-950 placeholder:text-[color:var(--input-placeholder)] transition-colors focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/25 focus:outline-none";

const exportBtnClassBase =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-normal text-gray-950 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/25";

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  onExportCsv,
  searchPlaceholder = "חיפוש...",
  exportLabel = "ייצוא CSV",
  afterSearch,
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
  /** Rendered after the search field (e.g. action button); kept on one row when space allows. */
  afterSearch?: ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
  compactExportOnNarrow?: boolean;
}) {
  const exportBtnClass = compactExportOnNarrow
    ? `h-11 w-11 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 ${exportBtnClassBase}`
    : `${exportBtnClassBase} w-full sm:w-auto`;

  return (
    <div
      className={
        compactExportOnNarrow
          ? `mb-4 flex flex-row flex-wrap items-center gap-2 ${className ?? ""}`
          : `mb-4 flex flex-row flex-wrap items-center gap-2 ${className ?? ""}`
      }
      dir={dirProp}
    >
      {dirProp === "rtl" && afterSearch}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className={`${inputClassBase} min-w-0 flex-1 basis-[min(100%,12rem)] ${
          dirProp === "rtl" ? "text-right" : ""
        }`}
        aria-label={searchPlaceholder}
      />
      {dirProp !== "rtl" && afterSearch}
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
              <ExportDownloadIcon className="text-emerald-600" />
            </span>
            <span className="hidden items-center gap-2 text-sm font-normal sm:inline-flex">
              <ExportDownloadIcon className="text-emerald-600" />
              {exportLabel}
            </span>
          </>
        ) : (
          <>
            <ExportDownloadIcon className="text-emerald-600" />
            {exportLabel}
          </>
        )}
      </button>
    </div>
  );
}
