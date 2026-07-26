-- ============================================================================
-- WizzTech Demo Protection Platform - Database Fix Migration
-- Run this in your Supabase SQL Editor to fix the RLS policy issue
-- that was causing the "Open Website" / generate-demo-link function to fail.
-- ============================================================================

-- FIX 1: Allow server-side (anon) to INSERT demo links
-- The generate-demo-link Netlify function runs without an authenticated session,
-- so the existing "authenticated only" policy blocks it. This new policy allows
-- the backend to create demo links.

DROP POLICY IF EXISTS "Backend can create demo links" ON public.demo_links;

CREATE POLICY "Backend can create demo links"
    ON public.demo_links
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);


-- FIX 2: Make created_by nullable so server-side inserts don't fail
-- When the Netlify function inserts without a user session, auth.uid() is NULL,
-- which causes a NOT NULL constraint violation if created_by has a DEFAULT of auth.uid().

ALTER TABLE public.demo_links
    ALTER COLUMN created_by DROP NOT NULL,
    ALTER COLUMN created_by DROP DEFAULT;


-- Verify the fix by checking existing policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'demo_links'
ORDER BY policyname;

-- FIX 3: Enable realtime replication for demo_links table
begin;
  -- Remove it first if it exists to avoid errors, then add it
  alter publication supabase_realtime drop table if exists public.demo_links;
  alter publication supabase_realtime add table public.demo_links;
commit;

