-- Fix 1: Replace overly permissive reviews SELECT policy with a more restrictive one
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;

CREATE POLICY "Users can view relevant reviews"
ON public.reviews
FOR SELECT
USING (
  auth.uid() = reviewer_id 
  OR auth.uid() = reviewee_id 
  OR is_conversation_member(auth.uid(), conversation_id)
);

-- Fix 2: Replace permissive INSERT policies on analytics tables with proper restrictions
-- For error_logs: Allow inserts but require user_id to match or be null for anonymous
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;

CREATE POLICY "Users can insert error logs"
ON public.error_logs
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- For performance_metrics: Same pattern
DROP POLICY IF EXISTS "Anyone can insert performance metrics" ON public.performance_metrics;

CREATE POLICY "Users can insert performance metrics"
ON public.performance_metrics
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- For analytics_events: Already has proper policy, but let's verify and fix if needed
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;

CREATE POLICY "Users can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());