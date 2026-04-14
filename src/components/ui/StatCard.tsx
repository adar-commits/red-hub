"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

function InfoHintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 16v-4.5M12 8h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  explanation,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  /** Shown in the (i) tooltip — tap on mobile, hover the icon on desktop. */
  explanation?: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  const [tipOpen, setTipOpen] = useState(false);
  const infoWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tipOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setTipOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [tipOpen]);

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
          <div className="flex items-start gap-1.5">
            <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-gray-700">{title}</p>
            {explanation ? (
              <div className="group/info relative shrink-0 pt-px" ref={infoWrapRef}>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white/90 text-gray-600 shadow-sm transition-colors hover:border-gray-400 hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/35"
                  aria-label={`הסבר: ${title}`}
                  aria-expanded={tipOpen}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                      setTipOpen((o) => !o);
                    }
                  }}
                >
                  <InfoHintIcon className="shrink-0" />
                </button>
                <div
                  role="tooltip"
                  className={`pointer-events-none absolute end-0 top-full z-50 mt-1.5 w-max max-w-[min(18rem,calc(100vw-2.5rem))] rounded-lg border border-gray-200 bg-white px-3 py-2 text-start text-xs font-normal normal-case leading-relaxed tracking-normal text-gray-700 shadow-lg ${
                    tipOpen ? "visible opacity-100 max-md:block" : "invisible opacity-0 max-md:hidden"
                  } md:invisible md:opacity-0 md:group-hover/info:visible md:group-hover/info:opacity-100`}
                >
                  {explanation}
                </div>
              </div>
            ) : null}
          </div>
          <p className="mt-1.5 text-lg font-bold leading-tight text-gray-950 tabular-nums">{value}</p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm sm:h-10 sm:w-10 sm:rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
