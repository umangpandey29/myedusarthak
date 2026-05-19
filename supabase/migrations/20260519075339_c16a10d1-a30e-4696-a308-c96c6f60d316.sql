CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'middle',
  student_name TEXT,
  class_sec TEXT,
  roll_no TEXT,
  session TEXT,
  percentage TEXT,
  image TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own reports"
  ON public.reports FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_reports_user_created ON public.reports(user_id, created_at DESC);