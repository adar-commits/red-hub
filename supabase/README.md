# Red Hub — Supabase

Run migrations in order in the SQL Editor (or Supabase CLI): `00001_initial_schema.sql`, `00002_announcements_sort_updated.sql`, `00003_designer_projects.sql`, `00003_designer_activity.sql`, `00004_admin_portal_users.sql`.

**Admin portal login** (`/admin`): credentials live in `public.admin_portal_users` (seed: `test@carpetshop.co.il`). Initial password is set in migration `00004_admin_portal_users.sql` (see comment there); rotate by updating `password_hash` (generate with `node -e "console.log(require('bcryptjs').hashSync('NEW',12))"`).

Create storage buckets in Dashboard: **invoices**, **project-photos** (both private). Designer uploads use `project-photos` with paths `{designer_code}/{project_id}/{uuid}.{ext}`. If `project-photos` is missing, the API will try to create it automatically (service role).
