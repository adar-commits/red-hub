-- Ordering for designer-facing announcement list + audit timestamps
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS sort_order INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

WITH numbered AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at DESC)) - 1 AS rn
  FROM public.announcements
)
UPDATE public.announcements a
SET sort_order = n.rn
FROM numbered n
WHERE a.id = n.id AND a.sort_order IS NULL;

UPDATE public.announcements SET updated_at = created_at WHERE updated_at IS NULL;
