-- Create enum for item categories
CREATE TYPE public.item_category AS ENUM (
  'electronics',
  'documents',
  'wallet',
  'bag',
  'jewelry',
  'clothing',
  'keys',
  'other'
);

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM (
  'active',
  'matched',
  'resolved',
  'expired',
  'cancelled'
);

-- Create lost_items table
CREATE TABLE public.lost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item details
  category public.item_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Location & time
  lost_date TIMESTAMP WITH TIME ZONE NOT NULL,
  lost_location_address TEXT,
  lost_location_lat DECIMAL(10, 8),
  lost_location_lng DECIMAL(11, 8),
  
  -- Auto details
  auto_number TEXT,
  route_description TEXT,
  driver_description TEXT,
  
  -- Status
  status public.report_status NOT NULL DEFAULT 'active',
  matched_driver_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lost_item_images table
CREATE TABLE public.lost_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID NOT NULL REFERENCES public.lost_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_item_images ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_lost_items_updated_at
  BEFORE UPDATE ON public.lost_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for lost_items

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.lost_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
  ON public.lost_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
  ON public.lost_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports"
  ON public.lost_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drivers can view active reports (for matching)
CREATE POLICY "Drivers can view active reports"
  ON public.lost_items
  FOR SELECT
  USING (
    status = 'active' AND 
    public.has_role(auth.uid(), 'driver')
  );

-- RLS Policies for lost_item_images

-- Users can view images of their own reports
CREATE POLICY "Users can view own report images"
  ON public.lost_item_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_items
      WHERE lost_items.id = lost_item_images.lost_item_id
      AND lost_items.user_id = auth.uid()
    )
  );

-- Drivers can view images of active reports
CREATE POLICY "Drivers can view active report images"
  ON public.lost_item_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_items
      WHERE lost_items.id = lost_item_images.lost_item_id
      AND lost_items.status = 'active'
      AND public.has_role(auth.uid(), 'driver')
    )
  );

-- Users can insert images for their own reports
CREATE POLICY "Users can insert own report images"
  ON public.lost_item_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lost_items
      WHERE lost_items.id = lost_item_images.lost_item_id
      AND lost_items.user_id = auth.uid()
    )
  );

-- Users can delete images from their own reports
CREATE POLICY "Users can delete own report images"
  ON public.lost_item_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lost_items
      WHERE lost_items.id = lost_item_images.lost_item_id
      AND lost_items.user_id = auth.uid()
    )
  );

-- Create storage bucket for lost item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lost-item-images', 'lost-item-images', true);

-- Storage policies for lost-item-images bucket
CREATE POLICY "Authenticated users can upload lost item images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lost-item-images');

CREATE POLICY "Anyone can view lost item images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'lost-item-images');

CREATE POLICY "Users can update their own lost item images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lost-item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own lost item images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'lost-item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create index for faster queries
CREATE INDEX idx_lost_items_user_id ON public.lost_items(user_id);
CREATE INDEX idx_lost_items_status ON public.lost_items(status);
CREATE INDEX idx_lost_items_created_at ON public.lost_items(created_at DESC);