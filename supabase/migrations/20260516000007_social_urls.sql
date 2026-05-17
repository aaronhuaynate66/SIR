-- Add Facebook, Twitter/X, TikTok URL columns to people table
ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS twitter_url  text,
  ADD COLUMN IF NOT EXISTS tiktok_url   text;
