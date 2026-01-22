-- Fix 1: Remove overly permissive driver access to passenger profiles
-- Drivers should only see profiles of people they're in conversation with (already covered by existing policy)
DROP POLICY IF EXISTS "Drivers can view passenger profiles for active reports" ON public.profiles;

-- Fix 2: Restrict reviews to authenticated users only (not public)
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() IS NOT NULL);