-- Drop the existing policy that uses has_role
DROP POLICY IF EXISTS "Drivers can view active non-draft reports" ON public.lost_items;

-- Create new policy that checks profiles.user_type instead
CREATE POLICY "Drivers can view active non-draft reports" 
ON public.lost_items 
FOR SELECT 
USING (
  (status = 'active'::report_status) 
  AND (is_draft = false) 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type = 'driver'
  )
);

-- Also fix the lost_item_images policy for drivers
DROP POLICY IF EXISTS "Drivers can view active report images" ON public.lost_item_images;

CREATE POLICY "Drivers can view active report images" 
ON public.lost_item_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM lost_items
    WHERE lost_items.id = lost_item_images.lost_item_id 
    AND lost_items.status = 'active'::report_status
    AND lost_items.is_draft = false
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.user_type = 'driver'
    )
  )
);