-- Single (or few) admin portal logins for NextAuth credentials (email + bcrypt password).
-- RLS on; no anon/authenticated policies — only service role (API routes) reads this table.

CREATE TABLE IF NOT EXISTS public.admin_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_portal_users ENABLE ROW LEVEL SECURITY;

-- Initial operator: test@carpetshop.co.il
-- Password (rotate in production): HomGroup@Admin2026!
-- Regenerate: node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD',12))"
INSERT INTO public.admin_portal_users (email, password_hash)
VALUES (
  'test@carpetshop.co.il',
  '$2b$12$BFXpjaoSf6xTarDmlBiXGOawqbAKpE4gS9aVysLwlDi3KuSrUgoPG'
)
ON CONFLICT (email) DO NOTHING;
