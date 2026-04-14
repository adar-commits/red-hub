"use client";

import type { ReactNode } from "react";

const inputClassBase =
  "min-h-[40px] sm:min-h-[44px] rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm text-gray-950 placeholder:text-[color:var(--input-placeholder)] transition-colors focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/25 focus:outline-none sm:px-4 sm:py-2.5";

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "חיפוש...",
  afterSearch,
  className,
  dir: dirProp,
  /** Hide the search input (afterSearch only). */
  hideSearch = false,
  /** Appended to the search+actions row flex (e.g. `max-sm:gap-0` to tighten mobile). */
  searchRowClassName = "",
  /** Extra classes for the search input (e.g. max width on mobile). */
  searchInputClassName = "",
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Rendered after the search field (e.g. action button); kept on one row when space allows. */
  afterSearch?: ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
  hideSearch?: boolean;
  searchRowClassName?: string;
  searchInputClassName?: string;
}) {
  const hasSearchRow = !hideSearch || afterSearch != null;

  if (!hasSearchRow) return null;

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 ${className ?? ""}`} dir={dirProp}>
      <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3 ${searchRowClassName}`}>
        {dirProp === "rtl" ? (
          <>
            {!hideSearch ? (
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${inputClassBase} min-w-0 flex-1 basis-[min(100%,12rem)] text-right ${searchInputClassName}`}
                aria-label={searchPlaceholder}
              />
            ) : null}
            {afterSearch}
          </>
        ) : (
          <>
            {afterSearch}
            {!hideSearch ? (
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${inputClassBase} min-w-0 flex-1 basis-[min(100%,12rem)] ${searchInputClassName}`}
                aria-label={searchPlaceholder}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
