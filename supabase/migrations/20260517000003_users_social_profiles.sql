-- Add social profile columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_url         text,
  ADD COLUMN IF NOT EXISTS instagram_username   text,
  ADD COLUMN IF NOT EXISTS twitter_username     text,
  ADD COLUMN IF NOT EXISTS tiktok_username      text;
