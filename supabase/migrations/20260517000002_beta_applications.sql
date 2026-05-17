-- Beta applications table
CREATE TABLE IF NOT EXISTS public.beta_applications (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  email        text NOT NULL UNIQUE,
  linkedin_url text,
  reason       text,
  role         text,
  company      text,
  status       text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.beta_applications
  USING (true) WITH CHECK (true);
