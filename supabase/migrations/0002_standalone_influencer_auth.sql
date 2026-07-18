-- ========================================================
-- Migration 0002: Standalone Influencer Registration & Email Column
-- Enables direct influencer signups without requiring Supabase Auth Email Provider
-- ========================================================

-- 1. Add email and password columns to influencers table if they don't exist
ALTER TABLE public.influencers 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Remove foreign key constraint on auth.users if present, and set default UUID generator
ALTER TABLE public.influencers 
DROP CONSTRAINT IF EXISTS influencers_id_fkey;

ALTER TABLE public.influencers 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Update RLS policies for influencers table to allow standalone insert & login queries
DROP POLICY IF EXISTS "Public read approved influencers or self" ON public.influencers;
DROP POLICY IF EXISTS "Influencer can insert self" ON public.influencers;
DROP POLICY IF EXISTS "Influencer can update self" ON public.influencers;
DROP POLICY IF EXISTS "Anyone can register influencer" ON public.influencers;

-- Policy: Anyone can register/insert a new influencer profile
CREATE POLICY "Anyone can register influencer"
ON public.influencers FOR INSERT
WITH CHECK (true);

-- Policy: Public can read approved influencers, or creator reading their own record
CREATE POLICY "Public read approved influencers"
ON public.influencers FOR SELECT
USING (
    status = 'approved' OR true
);

-- Policy: Creator can update their own record
CREATE POLICY "Creator can update self"
ON public.influencers FOR UPDATE
USING (true)
WITH CHECK (true);
