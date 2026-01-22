-- Fix SECURITY DEFINER view warning by using SECURITY INVOKER
-- =================================================================
DROP VIEW IF EXISTS public.profiles_display;

CREATE VIEW public.profiles_display
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio,
  user_type,
  is_online,
  is_verified,
  last_seen_at,
  created_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_display TO authenticated;