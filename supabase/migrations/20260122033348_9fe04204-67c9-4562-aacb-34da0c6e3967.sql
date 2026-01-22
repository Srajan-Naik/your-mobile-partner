-- Add driver online status columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

-- Create index for efficient online driver queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online) WHERE is_online = true;

-- Update RLS policy to allow conversation participants to view each other's profiles
CREATE POLICY "Conversation participants can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.passenger_id = auth.uid() AND c.driver_id = profiles.user_id)
         OR (c.driver_id = auth.uid() AND c.passenger_id = profiles.user_id)
    )
  );

-- Allow drivers to view passenger profiles for active reports they're responding to
CREATE POLICY "Drivers can view passenger profiles for active reports"
  ON public.profiles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'driver') AND
    EXISTS (
      SELECT 1 FROM public.lost_items li
      WHERE li.user_id = profiles.user_id
        AND li.status = 'active'
    )
  );

-- Create a function to insert notifications (service role only via edge functions)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _body text,
  _type text DEFAULT 'info',
  _action_url text DEFAULT NULL,
  _data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, action_url, data)
  VALUES (_user_id, _title, _body, _type, _action_url, _data)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Create trigger function to notify on new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation RECORD;
  _recipient_id uuid;
  _sender_name text;
BEGIN
  -- Get conversation details
  SELECT * INTO _conversation FROM public.conversations WHERE id = NEW.conversation_id;
  
  -- Determine recipient (the other person in the conversation)
  IF NEW.sender_id = _conversation.passenger_id THEN
    _recipient_id := _conversation.driver_id;
  ELSE
    _recipient_id := _conversation.passenger_id;
  END IF;
  
  -- Get sender's name
  SELECT COALESCE(display_name, 'Someone') INTO _sender_name 
  FROM public.profiles WHERE user_id = NEW.sender_id;
  
  -- Create notification for recipient
  PERFORM public.create_notification(
    _recipient_id,
    'New Message',
    _sender_name || ' sent you a message',
    'message',
    '/chat/' || NEW.conversation_id,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- Create trigger function to notify on new conversation (driver responded)
CREATE OR REPLACE FUNCTION public.notify_new_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item_title text;
  _driver_name text;
BEGIN
  -- Get lost item title
  SELECT title INTO _item_title FROM public.lost_items WHERE id = NEW.lost_item_id;
  
  -- Get driver's name
  SELECT COALESCE(display_name, 'A driver') INTO _driver_name 
  FROM public.profiles WHERE user_id = NEW.driver_id;
  
  -- Notify passenger that a driver has responded
  PERFORM public.create_notification(
    NEW.passenger_id,
    'Driver Response',
    _driver_name || ' may have found your ' || COALESCE(_item_title, 'item'),
    'match',
    '/chat/' || NEW.id,
    jsonb_build_object('conversation_id', NEW.id, 'lost_item_id', NEW.lost_item_id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new conversations
DROP TRIGGER IF EXISTS on_new_conversation ON public.conversations;
CREATE TRIGGER on_new_conversation
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_conversation();

-- Create trigger function to notify on new review
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reviewer_name text;
BEGIN
  -- Get reviewer's name
  SELECT COALESCE(display_name, 'Someone') INTO _reviewer_name 
  FROM public.profiles WHERE user_id = NEW.reviewer_id;
  
  -- Notify reviewee
  PERFORM public.create_notification(
    NEW.reviewee_id,
    'New Review',
    _reviewer_name || ' gave you a ' || NEW.rating || '-star review',
    'reward',
    '/profile',
    jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_review();

-- Create trigger function to notify on tip received
CREATE OR REPLACE FUNCTION public.notify_tip_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_name text;
BEGIN
  -- Only notify on completed tips
  IF NEW.type = 'tip' AND NEW.status = 'completed' THEN
    -- Get sender's name
    SELECT COALESCE(display_name, 'Someone') INTO _sender_name 
    FROM public.profiles WHERE user_id = NEW.from_user_id;
    
    -- Notify recipient
    PERFORM public.create_notification(
      NEW.to_user_id,
      'Tip Received',
      _sender_name || ' sent you a ₹' || NEW.amount || ' tip!',
      'reward',
      '/rewards',
      jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for tips
DROP TRIGGER IF EXISTS on_tip_received ON public.transactions;
CREATE TRIGGER on_tip_received
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tip_received();