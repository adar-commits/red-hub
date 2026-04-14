"use client";

import { useEffect, useRef, useCallback } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  preventDismiss = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** When true, overlay click and Escape do not close (e.g. during async submit). */
  preventDismiss?: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventDismiss) onClose();
    },
    [onClose, preventDismiss]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    if (first) first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !contentRef.current) return;
      const list = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (list.length === 0) return;
      const last = list[list.length - 1];
      const firstEl = list[0];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => {
      document.removeEventListener("keydown", handleTab);
      previouslyFocused?.focus();
    };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !preventDismiss) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      data-state="open"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] animate-in-backdrop sm:items-center sm:p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        data-state="open"
        className="animate-in-scale max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-300 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] text-gray-900 shadow-xl sm:rounded-2xl sm:pb-0"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {title && (
          <h2 id="modal-title" className="mb-3 px-4 pt-4 text-right text-lg font-bold text-[var(--brand-red)] sm:mb-4 sm:px-6 sm:pt-6 sm:text-xl">
            {title}
          </h2>
        )}
        <div className={`${title ? "px-4 pb-5 pt-0 sm:px-6 sm:pb-6" : "p-4 sm:p-6"} text-right`}>{children}</div>
      </div>
    </div>
  );
}
