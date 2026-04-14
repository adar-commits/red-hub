-- Designer activity audit log (admin read via service role; no anon/authenticated policies)
CREATE TABLE IF NOT EXISTS public.designer_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activity_type TEXT NOT NULL,
  designer_code TEXT NOT NULL,
  agent_name TEXT,
  phone TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_designer_activity_created_at ON public.designer_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designer_activity_type_created ON public.designer_activity (activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designer_activity_code_created ON public.designer_activity (designer_code, created_at DESC);

ALTER TABLE public.designer_activity ENABLE ROW LEVEL SECURITY;
