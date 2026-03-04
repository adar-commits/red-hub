"use client";

import { useEffect, useRef, useCallback } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
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
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      data-state="open"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in-backdrop"
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        data-state="open"
        className="animate-in-scale w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 text-gray-900"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {title && (
          <h2 id="modal-title" className="text-xl font-bold text-[var(--brand-red)] mb-4 px-6 pt-6 text-right">
            {title}
          </h2>
        )}
        <div className={`${title ? "px-6 pb-6" : "p-6"} text-right`}>{children}</div>
      </div>
    </div>
  );
}
