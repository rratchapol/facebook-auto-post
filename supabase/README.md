# Supabase setup for Slice 1

1. Create a Supabase project and copy the project URL and publishable key into `.env.local`.
2. Apply both migration files in `migrations/` in timestamp order with the Supabase CLI or SQL Editor.
3. Create the first administrator in **Authentication > Users** with email/password.
4. Promote that profile by running the following SQL with the real email:

```sql
update public.profiles
set role = 'admin', active = true
where email = 'admin@example.com';
```

5. Sign in at `/login`, then add the initial allowlisted Tier 1 or Tier 2 sources in `/sources`. Slice 2 reads RSS, Atom, and JSON Feed API endpoints; custom provider APIs are a later adapter.
6. Add `SUPABASE_SECRET_KEY` and `JOB_SECRET` to `.env.local` before using “ดึงข่าวตอนนี้” or scheduling ingestion. The secret key is server-only.

Do not put secret, Meta, or AI keys in browser-exposed variables. Only the two `NEXT_PUBLIC_SUPABASE_*` values are intended for the browser.
