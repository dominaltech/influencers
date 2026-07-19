-- ========================================================
-- Migration 0007: Add push_subscription JSONB column to influencers
-- ========================================================

ALTER TABLE public.influencers
    ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL;
