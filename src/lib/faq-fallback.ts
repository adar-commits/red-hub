import { FAQ_SECTIONS, FAQ_YOUTUBE_VIDEO_ID } from "@/data/faq-content";
import type { FaqDocumentPayload } from "@/lib/faq-shared";

/** Used when DB has no FAQ row or fetch fails (local dev). */
export const FAQ_STATIC_FALLBACK: FaqDocumentPayload = {
  settings: {
    page_title: "שאלות נפוצות",
    page_subtitle: "סרטון הדרכה ושאלות נפוצות לשימוש בפורטל",
    youtube_video_id: FAQ_YOUTUBE_VIDEO_ID,
    video_iframe_title: "סרטון הדרכה — פורטל אדריכלים ומעצבים",
  },
  sections: FAQ_SECTIONS.map((s) => ({
    heading: s.heading,
    items: s.items.map((it) => ({ title: it.title, body: it.body })),
  })),
};
