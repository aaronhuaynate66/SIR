CREATE TABLE IF NOT EXISTS public.microsoft_integrations (
  id             uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_token   text,
  refresh_token  text,
  token_expiry   timestamptz,
  scopes         text[]      NOT NULL DEFAULT '{}',
  last_sync_at   timestamptz,
  contacts_synced integer    NOT NULL DEFAULT 0,
  events_synced   integer    NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.microsoft_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own microsoft integration"
  ON public.microsoft_integrations FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_microsoft_integrations_user_id
  ON public.microsoft_integrations (user_id);
