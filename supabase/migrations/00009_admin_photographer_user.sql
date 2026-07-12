-- Admin portal Google SSO allowlist: photographer@carpetshop.co.il (full admin)
INSERT INTO public.admin_portal_users (email, password_hash)
VALUES (
  'photographer@carpetshop.co.il',
  '$2b$12$BFXpjaoSf6xTarDmlBiXGOawqbAKpE4gS9aVysLwlDi3KuSrUgoPG'
)
ON CONFLICT (email) DO NOTHING;
