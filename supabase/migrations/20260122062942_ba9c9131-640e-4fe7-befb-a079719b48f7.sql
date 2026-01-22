-- =================================================================
-- SECURITY REVIEW: Fix Sensitive Data Exposure (Phase 8 - Part 4)
-- =================================================================

-- 1. Drop the overly permissive policy that exposes all profile columns
-- =================================================================
DROP POLICY IF EXISTS "Authenticated users can view verified driver display info" ON public.profiles;

-- 2. Create a secure function to get public driver profile info only
-- This returns ONLY non-sensitive fields for verified drivers
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_driver_public_profile(_driver_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  is_verified boolean,
  is_online boolean,
  last_seen_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.is_online,
    p.last_seen_at
  FROM public.profiles p
  WHERE p.user_id = _driver_user_id
    AND p.user_type = 'driver'
    AND p.is_verified = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_public_profile(uuid) TO authenticated;

-- 3. Create function to get driver rating stats
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_driver_rating(_driver_user_id uuid)
RETURNS TABLE (
  avg_rating numeric,
  review_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROUND(AVG(r.rating)::numeric, 1) as avg_rating,
    COUNT(*)::bigint as review_count
  FROM public.reviews r
  WHERE r.reviewee_id = _driver_user_id
  GROUP BY r.reviewee_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_rating(uuid) TO authenticated;

-- 4. Fix audit_logs INSERT policy to prevent tampering
-- =================================================================
DROP POLICY IF EXISTS "Allow audit log inserts" ON public.audit_logs;

-- Only allow users to log their own actions (cannot spoof user_id)
CREATE POLICY "Users can log their own actions"
ON public.audit_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5. Add constraint to verify conversation lost_item ownership
-- This is best done via a trigger since RLS can't add constraints
-- =================================================================
CREATE OR REPLACE FUNCTION public.validate_conversation_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the lost_item belongs to the passenger
  IF NOT EXISTS (
    SELECT 1 FROM public.lost_items
    WHERE id = NEW.lost_item_id
    AND user_id = NEW.passenger_id
  ) THEN
    RAISE EXCEPTION 'Lost item must belong to the passenger';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_conversation_ownership_trigger ON public.conversations;
CREATE TRIGGER validate_conversation_ownership_trigger
BEFORE INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.validate_conversation_ownership();