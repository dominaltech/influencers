-- ========================================================
-- Migration 0006: Add reel_views and reel_likes to works
-- ========================================================

ALTER TABLE public.works
    ADD COLUMN IF NOT EXISTS reel_views INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS reel_likes INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;
