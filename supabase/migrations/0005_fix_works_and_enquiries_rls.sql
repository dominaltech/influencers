-- ========================================================
-- Migration 0005: Fix RLS Policies for Works & Enquiries Tables
-- Allows standalone creator profiles to add/manage works and receive enquiries
-- ========================================================

-- 1. Drop existing restrictive policies on works table
DROP POLICY IF EXISTS "Public read works" ON public.works;
DROP POLICY IF EXISTS "Influencer can insert own works" ON public.works;
DROP POLICY IF EXISTS "Influencer can update own works" ON public.works;
DROP POLICY IF EXISTS "Influencer can delete own works" ON public.works;
DROP POLICY IF EXISTS "Anyone can insert works" ON public.works;
DROP POLICY IF EXISTS "Anyone can read works" ON public.works;
DROP POLICY IF EXISTS "Anyone can delete works" ON public.works;

-- Create open policies for works table
CREATE POLICY "Anyone can read works"
ON public.works FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert works"
ON public.works FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update works"
ON public.works FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete works"
ON public.works FOR DELETE
USING (true);

-- 2. Drop existing policies on enquiries table
DROP POLICY IF EXISTS "Anyone can submit enquiry" ON public.enquiries;
DROP POLICY IF EXISTS "Influencer read own enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Anyone can read enquiries" ON public.enquiries;

-- Create open policies for enquiries table
CREATE POLICY "Anyone can submit enquiry"
ON public.enquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read enquiries"
ON public.enquiries FOR SELECT
USING (true);
