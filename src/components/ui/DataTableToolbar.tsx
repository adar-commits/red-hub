"use client";

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  onExportCsv,
  searchPlaceholder = "חיפוש...",
  exportLabel = "ייצוא CSV",
  className,
  dir: dirProp,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExportCsv: () => void;
  searchPlaceholder?: string;
  exportLabel?: string;
  className?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div
      className={`mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className ?? ""}`}
      dir={dirProp}
    >
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className={`w-full min-h-[44px] rounded-lg border-2 border-gray-400 bg-white px-4 py-2.5 text-sm text-gray-950 placeholder:text-[color:var(--input-placeholder)] focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/25 focus:outline-none transition-colors sm:min-w-[200px] sm:flex-1 ${dirProp === "rtl" ? "text-right" : ""}`}
        aria-label={searchPlaceholder}
      />
      <button
        type="button"
        onClick={onExportCsv}
        className="w-full min-h-[44px] shrink-0 rounded-lg border-2 border-gray-400 bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/25 sm:w-auto"
      >
        {exportLabel}
      </button>
    </div>
  );
}
