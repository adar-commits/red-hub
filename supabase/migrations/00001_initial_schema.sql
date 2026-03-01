-- Red Hub: designers (agentCode unique), announcements, project_photos, notifications
-- Run in Supabase SQL Editor or via Supabase CLI

-- Designers: one row per designer, designer_code (agentCode) UNIQUE
CREATE TABLE IF NOT EXISTS public.designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_code TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  business_name TEXT,
  business_type TEXT,
  company_id TEXT,
  business_address TEXT,
  city TEXT,
  design_type TEXT,
  specialization TEXT,
  experience_years TEXT,
  how_heard TEXT,
  date_of_birth DATE,
  marketing_consent BOOLEAN DEFAULT false,
  commission_rate NUMERIC(5,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designers_designer_code ON public.designers(designer_code);
CREATE INDEX IF NOT EXISTS idx_designers_phone ON public.designers(phone);

-- Announcements (admin-only write, designers read)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Project photos (designer uploads, internal storage)
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_code TEXT NOT NULL REFERENCES public.designers(designer_code) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_photos_designer_code ON public.project_photos(designer_code);

-- Notifications (in-app + PWA)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_code TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_designer_code ON public.notifications(designer_code);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(designer_code, read);

-- RLS: enable for all tables
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Designers, project_photos, notifications: no policies for anon (server uses service_role which bypasses RLS)
-- Authenticated (admin) full access for admin panel
CREATE POLICY "authenticated_full_designers" ON public.designers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_project_photos" ON public.project_photos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_notifications" ON public.notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Announcements: anon can read published only
CREATE POLICY "anon_read_published_announcements" ON public.announcements
  FOR SELECT TO anon USING (is_published = true);

-- Authenticated (e.g. admin) full access to announcements for CRUD
CREATE POLICY "authenticated_full_announcements" ON public.announcements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
