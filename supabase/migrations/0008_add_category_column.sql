-- ========================================================
-- Migration 0008: Add category column to influencers table
-- ========================================================

ALTER TABLE public.influencers 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'All-Rounder / General';

-- Update RLS comment (existing SELECT/INSERT/UPDATE policies apply automatically)
COMMENT ON COLUMN public.influencers.category IS 'Primary creator niche or category choice';
