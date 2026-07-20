-- Production reset: wipe all test/demo data. Schema, auth, RLS untouched.
DELETE FROM public.reports;

UPDATE public.profiles
   SET last_login_at = NULL,
       last_active_at = NULL,
       login_count = 0,
       is_online = false;