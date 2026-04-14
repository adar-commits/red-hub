-- Designer projects + Supabase Storage-backed project photos
-- Clears legacy project_photos rows (pre-project webhook era); adjust if you must preserve history.

CREATE TABLE IF NOT EXISTS public.designer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_code TEXT NOT NULL REFERENCES public.designers(designer_code) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  address TEXT,
  photographer_name TEXT,
  photographer_phone TEXT,
  carpet_models JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designer_projects_designer_code ON public.designer_projects(designer_code);
CREATE INDEX IF NOT EXISTS idx_designer_projects_created_at ON public.designer_projects(designer_code, created_at DESC);

ALTER TABLE public.designer_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_designer_projects" ON public.designer_projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- project_photos: link to project + storage object key; image_url optional (signed URLs at read time)
ALTER TABLE public.project_photos
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.designer_projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE public.project_photos ALTER COLUMN image_url DROP NOT NULL;

DELETE FROM public.project_photos;

ALTER TABLE public.project_photos ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE public.project_photos ALTER COLUMN storage_path SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_photos_project_id ON public.project_photos(project_id);
