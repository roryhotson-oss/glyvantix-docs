-- Supabase Postgres keep-alive via pg_cron.
--
-- The docs app's Supabase free-tier Postgres (project "Glyvantix") auto-pauses
-- after ~1 week of inactivity. This registers an in-database scheduled job that
-- runs a trivial query once an hour so the database is never idle long enough
-- to auto-pause. Unlike an external scheduler, pg_cron runs inside Postgres
-- itself, so it keeps working even when the web app is undeployed.
--
-- Idempotent: safe to re-run. Requires the pg_cron extension to be enabled in
-- the Supabase dashboard (Database -> Extensions -> pg_cron). On Supabase the
-- pg_cron extension is available on the default "postgres" database.
--
-- Apply in the Supabase dashboard SQL editor, via psql, or with the helper
-- script: npx tsx scripts/setup-keepalive-cron.ts

-- pg_cron must be enabled in the Supabase dashboard before this migration can
-- register jobs. The extension create is included for completeness but, on
-- Supabase, extensions are managed through the dashboard / `supabase db`.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any previous version of the job so re-running this migration updates
-- the schedule without leaving duplicate entries in cron.job.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'glyvantix_keepalive') THEN
    PERFORM cron.unschedule('glyvantix_keepalive');
  END IF;
END
$$;

-- SELECT 1 is enough to count as activity for the auto-pause timer. Once an
-- hour is well inside the ~1 week inactivity window and is negligible load.
-- The job runs as the current (postgres) role.
SELECT cron.schedule(
  'glyvantix_keepalive',
  '0 * * * *',
  $$SELECT 1;$$
);
