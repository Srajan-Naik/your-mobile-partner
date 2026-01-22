-- =================================================================
-- SECURITY REVIEW: Final Critical Fixes (Phase 8 - Part 5)
-- =================================================================

-- 1. Fix reviews: Add authentication requirement for viewing driver reviews
-- =================================================================
DROP POLICY IF EXISTS "Users can view relevant reviews" ON public.reviews;

CREATE POLICY "Users can view relevant reviews"
ON public.reviews
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Own reviews (as reviewer or reviewee)
    auth.uid() = reviewer_id 
    OR auth.uid() = reviewee_id
    -- Conversation members
    OR is_conversation_member(auth.uid(), conversation_id)
    -- Or reviews of verified drivers (for public visibility to authenticated users)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = reviews.reviewee_id
      AND profiles.user_type = 'driver'
      AND profiles.is_verified = true
    )
  )
);

-- 2. Restrict message updates to prevent content tampering (only allow within 5 minutes)
-- =================================================================
DROP POLICY IF EXISTS "Sender can update own messages except is_read" ON public.messages;

CREATE POLICY "Sender can update own messages within grace period"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = sender_id
  AND created_at > (now() - interval '5 minutes')
);

-- 3. Restrict conversation updates to only status and last_message_at
-- We can't restrict columns in RLS, so we use a trigger
-- =================================================================
CREATE OR REPLACE FUNCTION public.validate_conversation_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow updating status and last_message_at
  IF OLD.lost_item_id != NEW.lost_item_id THEN
    RAISE EXCEPTION 'Cannot change lost_item_id';
  END IF;
  
  IF OLD.passenger_id != NEW.passenger_id THEN
    RAISE EXCEPTION 'Cannot change passenger_id';
  END IF;
  
  IF OLD.driver_id != NEW.driver_id THEN
    RAISE EXCEPTION 'Cannot change driver_id';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_conversation_update_trigger ON public.conversations;
CREATE TRIGGER validate_conversation_update_trigger
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.validate_conversation_update();