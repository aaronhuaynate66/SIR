-- analytics_events: allow server-side inserts (service role bypasses RLS;
-- this policy covers anon-key writes from authenticated API routes)
create policy "analytics_events_insert"
  on public.analytics_events for insert
  with check (true);

-- ai_usage: same pattern — writes come from server-side cost tracker
create policy "ai_usage_insert"
  on public.ai_usage for insert
  with check (true);

-- notification_logs: service engine inserts, so allow all inserts
create policy "notification_logs_insert"
  on public.notification_logs for insert
  with check (true);

-- briefings: allow server-side inserts (briefing route uses service client)
do $$ begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'briefings'
  ) then
    execute $sql$
      create policy "briefings_insert"
        on public.briefings for insert
        with check (true)
    $sql$;
  end if;
end $$;
