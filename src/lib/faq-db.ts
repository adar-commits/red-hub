import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FaqDocumentPayload } from "@/lib/faq-shared";

type SectionRow = {
  heading: string;
  sort_order: number;
  faq_items: { title: string; body: string; sort_order: number }[] | null;
};

export async function fetchFaqDocumentFromDb(): Promise<FaqDocumentPayload | null> {
  const supabase = createServerSupabaseClient();

  const { data: settings, error: settingsError } = await supabase
    .from("faq_settings")
    .select("page_title, page_subtitle, youtube_video_id, video_iframe_title")
    .eq("id", "default")
    .maybeSingle();

  if (settingsError || !settings) return null;

  const { data: sectionsRaw, error: sectionsError } = await supabase
    .from("faq_sections")
    .select(
      `
      heading,
      sort_order,
      faq_items (
        title,
        body,
        sort_order
      )
    `,
    )
    .order("sort_order", { ascending: true });

  if (sectionsError || !sectionsRaw?.length) {
    return {
      settings: {
        page_title: settings.page_title,
        page_subtitle: settings.page_subtitle,
        youtube_video_id: settings.youtube_video_id ?? "",
        video_iframe_title: settings.video_iframe_title ?? "",
      },
      sections: [],
    };
  }

  const sections = (sectionsRaw as SectionRow[]).map((sec) => ({
    heading: sec.heading,
    items: [...(sec.faq_items ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((it) => ({ title: it.title, body: it.body })),
  }));

  return {
    settings: {
      page_title: settings.page_title,
      page_subtitle: settings.page_subtitle,
      youtube_video_id: settings.youtube_video_id ?? "",
      video_iframe_title: settings.video_iframe_title ?? "",
    },
    sections,
  };
}
