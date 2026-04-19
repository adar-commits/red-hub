# Red Hub — Supabase

Run migrations in order in the SQL Editor (or Supabase CLI): `00001_initial_schema.sql`, `00002_announcements_sort_updated.sql`, `00003_designer_projects.sql`, `00003_designer_activity.sql`, `00004_admin_portal_users.sql`, `00005_faq_content.sql` (FAQ page + `replace_faq_content` for admin).

**Admin portal login** (`/admin`): Google SSO only (NextAuth). Allowlist by **email** in `public.admin_portal_users` — the Google account must match a row’s `email` (seed: `test@carpetshop.co.il`). Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` in Vercel; in Google Cloud OAuth, add redirect URI `https://<your-domain>/api/auth/callback/google`. `password_hash` is unused for SSO but kept for migration compatibility.

Create storage buckets in Dashboard: **invoices**, **project-photos** (both private). Designer uploads use `project-photos` with paths `{designer_code}/{project_id}/{uuid}.{ext}`. If `project-photos` is missing, the API will try to create it automatically (service role).
