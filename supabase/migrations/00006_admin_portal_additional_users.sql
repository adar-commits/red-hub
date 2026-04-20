-- Additional admin portal Google SSO allowlist (password_hash unused for SSO; placeholder matches 00004).
INSERT INTO public.admin_portal_users (email, password_hash)
VALUES
  (
    'noa@carpetshop.co.il',
    '$2b$12$BFXpjaoSf6xTarDmlBiXGOawqbAKpE4gS9aVysLwlDi3KuSrUgoPG'
  ),
  (
    'designers@carpetshop.co.il',
    '$2b$12$BFXpjaoSf6xTarDmlBiXGOawqbAKpE4gS9aVysLwlDi3KuSrUgoPG'
  )
ON CONFLICT (email) DO NOTHING;
