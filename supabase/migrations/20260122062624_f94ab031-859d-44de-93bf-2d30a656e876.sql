-- =================================================================
-- SECURITY REVIEW: Fix Remaining RLS Issues (Phase 8 - Part 2)
-- =================================================================

-- 1. Create profiles_public view with only safe display fields
-- This prevents conversation partners from seeing sensitive contact info
-- =================================================================
CREATE OR REPLACE VIEW public.profiles_display AS
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

-- 2. Add audit logging table for sensitive data access
-- =================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "Allow audit log inserts"
ON public.audit_logs
FOR INSERT
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- 3. Create function for audit logging
-- =================================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _table_name text,
  _record_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), _action, _table_name, _record_id, _details)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) TO authenticated;

-- 4. Fix reviews: Allow users to update their own reviews within 24 hours
-- =================================================================
CREATE POLICY "Users can update own reviews within 24 hours"
ON public.reviews
FOR UPDATE
USING (
  auth.uid() = reviewer_id
  AND created_at > (now() - interval '24 hours')
);

-- 5. Fix lost_item_images: Allow users to update their own images
-- =================================================================
CREATE POLICY "Users can update own report images"
ON public.lost_item_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM lost_items
    WHERE lost_items.id = lost_item_images.lost_item_id
    AND lost_items.user_id = auth.uid()
  )
);

-- 6. Fix user_roles: Allow admins to manage roles
-- =================================================================
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));