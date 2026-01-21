-- ==========================================
-- Phase 4: Communication, Profile & Advanced Features
-- ==========================================

-- 1. Driver Verifications Table
CREATE TABLE public.driver_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  license_number TEXT,
  license_storage_path TEXT,
  vehicle_registration_number TEXT,
  vehicle_registration_storage_path TEXT,
  photo_verification_storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_verifications
CREATE POLICY "Drivers can view own verification"
  ON public.driver_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert own verification"
  ON public.driver_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update own verification"
  ON public.driver_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_driver_verifications_updated_at
  BEFORE UPDATE ON public.driver_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 2. Conversations Table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lost_item_id UUID NOT NULL REFERENCES public.lost_items(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'closed')),
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lost_item_id, driver_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

CREATE POLICY "Drivers can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = driver_id AND has_role(auth.uid(), 'driver'));

CREATE POLICY "Participants can update conversation"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

-- Trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 3. Messages Table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'system')),
  image_storage_path TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = _conversation_id
      AND (passenger_id = _user_id OR driver_id = _user_id)
  )
$$;

-- RLS Policies for messages
CREATE POLICY "Conversation members can view messages"
  ON public.messages FOR SELECT
  USING (is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Conversation members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (is_conversation_member(auth.uid(), conversation_id) AND auth.uid() = sender_id);

CREATE POLICY "Sender can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);


-- 4. Notifications Table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'match', 'message', 'reward', 'system')),
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);


-- 5. Reviews Table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Conversation members can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (is_conversation_member(auth.uid(), conversation_id) AND auth.uid() = reviewer_id);


-- 6. Transactions (Rewards) Table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('tip', 'reward', 'withdrawal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create transactions as sender"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);


-- 7. Driver Verification Documents Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for driver-documents bucket
CREATE POLICY "Drivers can upload own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'driver-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND has_role(auth.uid(), 'driver')
  );

CREATE POLICY "Drivers can view own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers can delete own verification docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- 8. Chat Images Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-images bucket
CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view chat images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-images'
    AND auth.role() = 'authenticated'
  );


-- 9. Add email and emergency_contact to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;