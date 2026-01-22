-- Drop the old constraint and add 'report' to allowed types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['info'::text, 'match'::text, 'message'::text, 'reward'::text, 'system'::text, 'report'::text]));