# Red Hub — Supabase

Run migrations in order in the SQL Editor (or Supabase CLI): `00001_initial_schema.sql`, `00002_announcements_sort_updated.sql`, `00003_designer_projects.sql`.

Create storage buckets in Dashboard: **invoices**, **project-photos** (both private). Designer uploads use `project-photos` with paths `{designer_code}/{project_id}/{uuid}.{ext}`.
