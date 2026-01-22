-- Drop the current INSERT policy for conversations
DROP POLICY IF EXISTS "Drivers can create conversations" ON public.conversations;

-- Create new INSERT policy that checks driver status from profiles table
CREATE POLICY "Drivers can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = driver_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_type = 'driver'
    )
  );