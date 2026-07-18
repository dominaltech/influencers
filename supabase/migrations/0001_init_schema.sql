-- ========================================================
-- CityFame Initial Database Schema Migration
-- ========================================================

-- 1. Create influencers table
CREATE TABLE IF NOT EXISTS public.influencers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    instagram_handle TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT 'Solapur',
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    followers_count INTEGER NOT NULL DEFAULT 0,
    avg_views INTEGER NOT NULL DEFAULT 0,
    dp_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create works table
CREATE TABLE IF NOT EXISTS public.works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube')),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create enquiries table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- Enable Row Level Security (RLS)
-- ========================================================

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- RLS Policies: influencers
-- ========================================================

-- Public read approved influencers, or influencers reading their own record regardless of status
CREATE POLICY "Public read approved influencers or self"
ON public.influencers FOR SELECT
USING (
    status = 'approved' OR auth.uid() = id
);

-- Authenticated users can insert their own row
CREATE POLICY "Influencer can insert self"
ON public.influencers FOR INSERT
WITH CHECK (
    auth.uid() = id
);

-- Influencer can update their own row
CREATE POLICY "Influencer can update self"
ON public.influencers FOR UPDATE
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);

-- ========================================================
-- RLS Policies: works
-- ========================================================

-- Anyone can view works of influencers
CREATE POLICY "Public read works"
ON public.works FOR SELECT
USING (true);

-- Only owning influencer can insert works
CREATE POLICY "Influencer can insert own works"
ON public.works FOR INSERT
WITH CHECK (
    auth.uid() = influencer_id
);

-- Only owning influencer can update works
CREATE POLICY "Influencer can update own works"
ON public.works FOR UPDATE
USING (
    auth.uid() = influencer_id
)
WITH CHECK (
    auth.uid() = influencer_id
);

-- Only owning influencer can delete works
CREATE POLICY "Influencer can delete own works"
ON public.works FOR DELETE
USING (
    auth.uid() = influencer_id
);

-- ========================================================
-- RLS Policies: enquiries
-- ========================================================

-- Anyone (public/anon) can submit an enquiry
CREATE POLICY "Anyone can submit enquiry"
ON public.enquiries FOR INSERT
WITH CHECK (true);

-- Only the target influencer can view their own received enquiries
CREATE POLICY "Influencer read own enquiries"
ON public.enquiries FOR SELECT
USING (
    auth.uid() = influencer_id
);

-- ========================================================
-- Storage Bucket Setup for 'dp'
-- ========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('dp', 'dp', true)
ON CONFLICT (id) DO NOTHING;

-- Public access to read profile pictures
CREATE POLICY "Public Read Access for DP"
ON storage.objects FOR SELECT
USING (bucket_id = 'dp');

-- Authenticated users can upload their own profile picture
CREATE POLICY "Authenticated Upload Access for DP"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'dp' AND auth.role() = 'authenticated'
);

-- Authenticated users can update/delete their own profile picture
CREATE POLICY "Authenticated Update Access for DP"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'dp' AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete Access for DP"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'dp' AND auth.role() = 'authenticated'
);
