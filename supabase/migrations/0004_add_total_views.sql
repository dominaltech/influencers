-- ========================================================
-- Migration 0004: Add Total Views column to influencers table
-- ========================================================

ALTER TABLE public.influencers 
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
