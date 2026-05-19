-- Add page_path to analytics_events
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS page_path text;

-- Allow authenticated users to insert their own events
-- (previously only SELECT policy existed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analytics_events'
    AND policyname  = 'users insert own analytics'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "users insert own analytics"
        ON public.analytics_events FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    $p$;
  END IF;
END $$;
