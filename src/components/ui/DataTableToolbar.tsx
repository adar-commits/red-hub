"use client";

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  onExportCsv,
  searchPlaceholder = "חיפוש...",
  exportLabel = "ייצוא CSV",
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExportCsv: () => void;
  searchPlaceholder?: string;
  exportLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="flex-1 min-w-[180px] rounded-lg border border-gray-300 px-4 py-2 text-sm placeholder:text-gray-500 focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none transition-colors"
        aria-label={searchPlaceholder}
      />
      <button
        type="button"
        onClick={onExportCsv}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-[var(--brand-red)]/20 focus:outline-none transition-colors"
      >
        {exportLabel}
      </button>
    </div>
  );
}
