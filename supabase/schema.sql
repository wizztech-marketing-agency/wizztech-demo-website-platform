-- ============================================================================
-- WizzTech Demo Protection Platform - Database Schema & Security Policies
-- ============================================================================

-- 1. Websites Registry Table
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_protected BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Optimize search on production URL
CREATE INDEX IF NOT EXISTS idx_websites_url ON public.websites(url);

-- Enable Row Level Security (RLS)
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Websites
-- Owner has full CRUD control
CREATE POLICY "Owners can manage their own websites"
    ON public.websites
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Public can check website status (required for future client-side intercept check)
CREATE POLICY "Public can view website protection status"
    ON public.websites
    FOR SELECT
    TO anon, authenticated
    USING (true);


-- 2. Demo Links Table
CREATE TABLE IF NOT EXISTS public.demo_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expiry_at TIMESTAMPTZ NOT NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Optimize queries linking to websites
CREATE INDEX IF NOT EXISTS idx_demo_links_website_id ON public.demo_links(website_id);
CREATE INDEX IF NOT EXISTS idx_demo_links_token ON public.demo_links(token);

-- Enable Row Level Security (RLS)
ALTER TABLE public.demo_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Demo Links
-- Owner has full CRUD control
CREATE POLICY "Owners can manage their own demo links"
    ON public.demo_links
    FOR ALL
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Public can read demo links (required to verify if a token is valid and not expired)
CREATE POLICY "Public can read demo links for verification"
    ON public.demo_links
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Public can increment views_count (required when the client website opens)
CREATE POLICY "Public can increment views count on open"
    ON public.demo_links
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
