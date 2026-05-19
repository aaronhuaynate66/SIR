-- Module: Smart Actions — AI-generated daily relationship action recommendations
CREATE TABLE IF NOT EXISTS public.action_suggestions (
  id                 uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid        NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  person_id          uuid        NOT NULL REFERENCES public.people(id)  ON DELETE CASCADE,
  action_text        text        NOT NULL,  -- what to do today (short imperative)
  timing_reason      text        NOT NULL,  -- why now, not later
  message_suggestion text        NOT NULL,  -- exact message to send
  impact_prediction  text        NOT NULL,  -- what you gain / lose
  urgency            text        NOT NULL   CHECK (urgency IN ('high', 'medium', 'low')),
  status             text        NOT NULL   DEFAULT 'pending'
                                            CHECK (status IN ('pending', 'completed', 'postponed', 'dismissed')),
  date_bucket        date        NOT NULL   DEFAULT CURRENT_DATE,
  created_at         timestamptz NOT NULL   DEFAULT now(),
  completed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS action_suggestions_user_date_idx
  ON public.action_suggestions(user_id, date_bucket);

CREATE INDEX IF NOT EXISTS action_suggestions_person_idx
  ON public.action_suggestions(person_id);

ALTER TABLE public.action_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_action_suggestions"
  ON public.action_suggestions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
