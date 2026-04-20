-- Fix: "DELETE required a WHERE clause" when saving FAQ from admin (unqualified DELETE blocked).
CREATE OR REPLACE FUNCTION public.replace_faq_content(
  p_page_title TEXT,
  p_page_subtitle TEXT,
  p_youtube_video_id TEXT,
  p_video_iframe_title TEXT,
  p_sections JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sec JSONB;
  idx INT := 0;
  jdx INT;
  it JSONB;
  new_sid UUID;
BEGIN
  INSERT INTO public.faq_settings (id, page_title, page_subtitle, youtube_video_id, video_iframe_title, updated_at)
  VALUES (
    'default',
    p_page_title,
    p_page_subtitle,
    COALESCE(p_youtube_video_id, ''),
    COALESCE(p_video_iframe_title, ''),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    page_title = EXCLUDED.page_title,
    page_subtitle = EXCLUDED.page_subtitle,
    youtube_video_id = EXCLUDED.youtube_video_id,
    video_iframe_title = EXCLUDED.video_iframe_title,
    updated_at = now();

  DELETE FROM public.faq_sections WHERE true;

  IF p_sections IS NULL OR jsonb_typeof(p_sections) != 'array' THEN
    RETURN;
  END IF;

  FOR sec IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    INSERT INTO public.faq_sections (heading, sort_order)
    VALUES (COALESCE(sec->>'heading', ''), idx)
    RETURNING id INTO new_sid;

    jdx := 0;
    IF sec->'items' IS NOT NULL AND jsonb_typeof(sec->'items') = 'array' THEN
      FOR it IN SELECT * FROM jsonb_array_elements(sec->'items')
      LOOP
        INSERT INTO public.faq_items (section_id, title, body, sort_order)
        VALUES (
          new_sid,
          COALESCE(it->>'title', ''),
          COALESCE(it->>'body', ''),
          jdx
        );
        jdx := jdx + 1;
      END LOOP;
    END IF;

    idx := idx + 1;
  END LOOP;
END;
$$;
