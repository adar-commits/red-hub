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

/** Softer on mobile; sm+ stays a bit stronger for desktop clarity */
const exportBtnClassBase =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border max-sm:border-gray-200 max-sm:bg-white/90 max-sm:px-3 max-sm:text-gray-600 max-sm:shadow-none border-gray-300 bg-white px-4 py-2.5 text-sm font-normal text-gray-800 hover:bg-gray-50 max-sm:hover:bg-gray-50/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/20";

const exportIconClass =
  "text-gray-500 max-sm:h-[18px] max-sm:w-[18px] sm:text-emerald-600/90";

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
  /** Hide the search input (export / afterSearch only). */
  hideSearch = false,
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
  hideSearch?: boolean;
}) {
  const exportBtnClass = compactExportOnNarrow
    ? `h-10 w-10 max-sm:h-10 max-sm:w-10 sm:h-auto sm:min-h-[44px] sm:w-auto sm:px-4 sm:py-2.5 ${exportBtnClassBase}`
    : `${exportBtnClassBase} ${hideSearch ? "w-auto" : "w-full sm:w-auto"}`;

  const hasSearchRow = !hideSearch || afterSearch != null;

  return (
    <div
      className={`mb-4 max-sm:grid max-sm:grid-cols-1 max-sm:gap-y-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 ${
        className ?? ""
      }`}
      dir={dirProp}
    >
      {hasSearchRow ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 max-sm:order-2 sm:min-w-0 sm:flex-1">
          {dirProp === "rtl" && afterSearch}
          {!hideSearch ? (
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
          ) : null}
          {dirProp !== "rtl" && afterSearch}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onExportCsv}
        className={`${
          dirProp === "rtl" ? "max-sm:justify-self-end" : "max-sm:justify-self-start"
        } ${hasSearchRow ? "max-sm:order-1" : ""} sm:justify-self-auto ${exportBtnClass}`}
        aria-label={exportLabel}
        title={exportLabel}
      >
        {compactExportOnNarrow ? (
          <>
            <span className="sm:hidden">
              <ExportDownloadIcon className={exportIconClass} />
            </span>
            <span className="hidden items-center gap-2 text-sm font-normal sm:inline-flex">
              <ExportDownloadIcon className={exportIconClass} />
              {exportLabel}
            </span>
          </>
        ) : (
          <>
            <ExportDownloadIcon className={exportIconClass} />
            {exportLabel}
          </>
        )}
      </button>
    </div>
  );
}
