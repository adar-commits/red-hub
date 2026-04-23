-- Optional URL: entire announcement card becomes a link (designer home).
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS link_href TEXT;

COMMENT ON COLUMN public.announcements.link_href IS 'If set, announcement card is clickable to this href (https or in-app path).';
