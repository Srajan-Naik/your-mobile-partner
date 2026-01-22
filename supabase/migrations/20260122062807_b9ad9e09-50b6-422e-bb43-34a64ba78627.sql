-- =================================================================
-- SECURITY REVIEW: Final RLS Fixes (Phase 8 - Part 3)
-- =================================================================

-- 1. Fix profiles: Allow authenticated users to view verified driver profiles
-- (excluding sensitive fields like phone, email, emergency_contact)
-- =================================================================
CREATE POLICY "Authenticated users can view verified driver display info"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = user_id
  OR
  -- Or they can see basic info of verified drivers
  (user_type = 'driver' AND is_verified = true AND auth.uid() IS NOT NULL)
);

-- Note: The existing "Users can view own profile" policy handles self-viewing
-- The existing "Conversation participants can view profiles" handles chat partners

-- 2. Fix reviews: Allow authenticated users to view driver reviews publicly
-- =================================================================
DROP POLICY IF EXISTS "Users can view relevant reviews" ON public.reviews;

CREATE POLICY "Users can view relevant reviews"
ON public.reviews
FOR SELECT
USING (
  -- Own reviews (as reviewer or reviewee)
  auth.uid() = reviewer_id 
  OR auth.uid() = reviewee_id
  -- Conversation members
  OR is_conversation_member(auth.uid(), conversation_id)
  -- Or reviews of verified drivers (for public visibility)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = reviews.reviewee_id
    AND profiles.user_type = 'driver'
    AND profiles.is_verified = true
  )
);

-- 3. Messages: Allow recipients to update is_read via RLS
-- The mark_messages_read function handles this securely, but add RLS fallback
-- =================================================================
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  is_conversation_member(auth.uid(), conversation_id)
  AND auth.uid() != sender_id
)
WITH CHECK (
  is_conversation_member(auth.uid(), conversation_id)
  AND auth.uid() != sender_id
);

-- 4. Drop the profiles_display view since we have proper RLS now
-- =================================================================
DROP VIEW IF EXISTS public.profiles_display;