-- Module 34: Custom relationship dates
CREATE TABLE IF NOT EXISTS public.people_dates (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  person_id  uuid        NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  label      text        NOT NULL,
  date       date        NOT NULL,
  recurring  boolean     NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS people_dates_user_idx    ON public.people_dates(user_id);
CREATE INDEX IF NOT EXISTS people_dates_person_idx  ON public.people_dates(person_id);

ALTER TABLE public.people_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own people dates"
  ON public.people_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
