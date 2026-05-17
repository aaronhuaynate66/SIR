-- Waitlist table for beta access
CREATE TABLE IF NOT EXISTS public.waitlist (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      text NOT NULL UNIQUE,
  name       text,
  source     text DEFAULT 'landing',
  position   integer,
  invited    boolean DEFAULT false,
  invited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (no user RLS needed — public signups)
CREATE POLICY "service_role_all" ON public.waitlist
  USING (true) WITH CHECK (true);

-- Auto-assign position on insert
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position FROM public.waitlist;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waitlist_position_trigger ON public.waitlist;
CREATE TRIGGER waitlist_position_trigger
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION set_waitlist_position();
