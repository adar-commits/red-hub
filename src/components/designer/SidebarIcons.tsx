import type { ReactNode } from "react";

/** Stroke nav glyphs (currentColor — tinted by parent tile / active state). */

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export type SidebarGlyphId =
  | "home"
  | "deals"
  | "commissions"
  | "business"
  | "photos"
  | "faq"
  | "contact"
  | "admin"
  | "logout";

export function SidebarGlyph({ id, className = "h-5 w-5 shrink-0" }: { id: SidebarGlyphId; className?: string }) {
  switch (id) {
    case "home":
      return (
        <Svg className={className}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5Z" />
        </Svg>
      );
    case "deals":
      return (
        <Svg className={className}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </Svg>
      );
    case "commissions":
      return (
        <Svg className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h6" />
        </Svg>
      );
    case "business":
      return (
        <Svg className={className}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h2M8 13h8M8 17h5" />
        </Svg>
      );
    case "photos":
      return (
        <Svg className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="m21 15-5-5L6 20" />
        </Svg>
      );
    case "faq":
      return (
        <Svg className={className}>
          <path d="M6 4h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M9 9h4M9 13h6" />
        </Svg>
      );
    case "contact":
      return (
        <Svg className={className}>
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6Z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </Svg>
      );
    case "admin":
      return (
        <Svg className={className}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </Svg>
      );
    case "logout":
      return (
        <Svg className={className}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </Svg>
      );
    default:
      return null;
  }
}
