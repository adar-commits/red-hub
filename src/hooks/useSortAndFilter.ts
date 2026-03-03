"use client";

import { useMemo, useState, useCallback } from "react";

export type SortDir = "asc" | "desc" | null;

export interface SortFilterColumn<T> {
  key: keyof T | string;
  label: string;
  /** Optional: value for search/export; default is row[key] */
  getValue?: (row: T) => string | number | null | undefined;
}

function getCellValue<T>(row: T, col: SortFilterColumn<T>): string {
  if (col.getValue) {
    const v = col.getValue(row);
    return v != null ? String(v) : "";
  }
  const v = (row as Record<string, unknown>)[col.key as string];
  return v != null ? String(v) : "";
}

function searchMatch<T>(row: T, columns: SortFilterColumn<T>[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = q.split(/\s+/).filter(Boolean);
  const rowText = columns.map((c) => getCellValue(row, c)).join(" ").toLowerCase();
  return words.every((w) => rowText.includes(w));
}

function nextSortDir(current: SortDir): SortDir {
  if (current === null || current === "desc") return "asc";
  return "desc";
}

export function useSortAndFilter<T>(
  rows: T[],
  columns: SortFilterColumn<T>[],
  options?: { searchPlaceholder?: string }
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<{ key: keyof T | string; dir: SortDir }>({
    key: "" as keyof T,
    dir: null,
  });

  const sortKey = sortState.key || null;
  const sortDir = sortState.dir;

  const toggleSort = useCallback((key: keyof T | string) => {
    setSortState((prev) => {
      const sameKey = prev.key === key;
      const nextDir = sameKey ? (prev.dir === "asc" ? "desc" : "asc") : "asc";
      return { key, dir: nextDir };
    });
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => searchMatch(row, columns, searchQuery));
  }, [rows, columns, searchQuery]);

  const filteredSortedRows = useMemo(() => {
    if (!sortKey || !sortDir) return [...filteredRows];
    const col = columns.find((c) => (c.key as string) === sortKey);
    const getVal = col?.getValue ?? ((row: T) => (row as Record<string, unknown>)[sortKey as string]);
    return [...filteredRows].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const aStr = va != null ? String(va) : "";
      const bStr = vb != null ? String(vb) : "";
      const cmp = aStr.localeCompare(bStr, "he", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sortKey, sortDir, columns]);

  const exportCsv = useCallback(
    (filename: string) => {
      const BOM = "\uFEFF";
      const headers = columns.map((c) => c.label);
      const escape = (s: string) => {
        const t = String(s);
        if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
        return t;
      };
      const rowsCsv = filteredSortedRows.map((row) =>
        columns.map((c) => escape(getCellValue(row, c))).join(",")
      );
      const csv = BOM + [headers.join(","), ...rowsCsv].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [filteredSortedRows, columns]
  );

  return {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortDir,
    toggleSort,
    filteredRows,
    filteredSortedRows,
    exportCsv,
    searchPlaceholder: options?.searchPlaceholder ?? "חיפוש...",
  };
}
