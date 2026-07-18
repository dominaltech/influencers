-- ========================================================
-- Migration 0003: Public Storage Upload Policy for Profile Pictures ('dp' bucket)
-- Allows public/anon profile photo uploads during standalone registration
-- ========================================================

-- 1. Ensure storage bucket 'dp' exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('dp', 'dp', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing restrictive policies on storage.objects for 'dp' bucket
DROP POLICY IF EXISTS "Public Read Access for DP" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access for DP" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access for DP" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access for DP" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload DP" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view DP" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update DP" ON storage.objects;

-- 3. Create open public storage policies for 'dp' bucket
CREATE POLICY "Anyone can view DP"
ON storage.objects FOR SELECT
USING (bucket_id = 'dp');

CREATE POLICY "Anyone can upload DP"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dp');

CREATE POLICY "Anyone can update DP"
ON storage.objects FOR UPDATE
USING (bucket_id = 'dp')
WITH CHECK (bucket_id = 'dp');
