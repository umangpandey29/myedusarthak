
-- ============ 1. PROFILES: login tracking columns ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;

-- ============ 2. ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Backfill: everyone gets 'teacher'
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Extend handle_new_user to also assign teacher role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'teacher') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- Ensure trigger on auth.users exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ 3. PROFILES RLS: tighten ============
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ 4. REPORTS RLS: owner-only + admin view + edit ============
DROP POLICY IF EXISTS "Reports readable by all authenticated" ON public.reports;
DROP POLICY IF EXISTS "Users view their own reports" ON public.reports;
CREATE POLICY "Users view their own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view all reports" ON public.reports;
CREATE POLICY "Admins view all reports" ON public.reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users update their own reports" ON public.reports;
CREATE POLICY "Users update their own reports" ON public.reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ 5. INDEXES ============
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);

-- ============ 6. updated_at column on reports (for edits) ============
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.tg_reports_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_reports_updated_at();

-- ============ 7. LOGIN TRACKING RPC ============
CREATE OR REPLACE FUNCTION public.record_login()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET last_login_at = now(),
         last_active_at = now(),
         login_count = login_count + 1,
         is_online = true
   WHERE id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.touch_active()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET last_active_at = now() WHERE id = auth.uid();
END; $$;

GRANT EXECUTE ON FUNCTION public.record_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_active() TO authenticated;

-- ============ 8. AGGREGATE ANALYTICS (no student PII) ============
-- Teacher leaderboard: name + report count only
CREATE OR REPLACE FUNCTION public.analytics_teacher_leaderboard()
RETURNS TABLE(user_id uuid, full_name text, email text, report_count bigint, last_login_at timestamptz, last_active_at timestamptz, login_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email,
         COALESCE(r.cnt, 0) AS report_count,
         p.last_login_at, p.last_active_at, p.login_count
    FROM public.profiles p
    LEFT JOIN (SELECT user_id, COUNT(*)::bigint AS cnt FROM public.reports GROUP BY user_id) r
      ON r.user_id = p.id
   ORDER BY report_count DESC, p.full_name ASC;
$$;

-- Daily aggregate for last N days: date + count only
CREATE OR REPLACE FUNCTION public.analytics_daily_totals(_days integer DEFAULT 30)
RETURNS TABLE(day date, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (created_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::bigint
    FROM public.reports
   WHERE created_at >= now() - (_days || ' days')::interval
   GROUP BY day ORDER BY day;
$$;

-- School summary counts
CREATE OR REPLACE FUNCTION public.analytics_school_summary()
RETURNS TABLE(
  total_teachers bigint,
  active_today bigint,
  total_reports bigint,
  reports_today bigint,
  reports_week bigint,
  reports_month bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.profiles WHERE last_active_at >= now() - interval '1 day'),
    (SELECT COUNT(*) FROM public.reports),
    (SELECT COUNT(*) FROM public.reports WHERE created_at >= date_trunc('day', now())),
    (SELECT COUNT(*) FROM public.reports WHERE created_at >= now() - interval '7 days'),
    (SELECT COUNT(*) FROM public.reports WHERE created_at >= now() - interval '30 days');
$$;

GRANT EXECUTE ON FUNCTION public.analytics_teacher_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_daily_totals(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_school_summary() TO authenticated;
