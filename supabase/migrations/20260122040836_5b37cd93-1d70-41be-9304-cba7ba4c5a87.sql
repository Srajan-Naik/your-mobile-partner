-- Create analytics_events table for tracking user actions and page views
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  event_name text NOT NULL,
  page_path text,
  properties jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  screen_width integer,
  screen_height integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for querying by event type and date
CREATE INDEX idx_analytics_events_type_date ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert own analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- Allow admins to view all events (for analytics dashboard)
CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create error_logs table for error tracking
CREATE TABLE public.error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  component_stack text,
  page_path text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for querying errors by date
CREATE INDEX idx_error_logs_date ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_user ON public.error_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert error logs (even anonymous users)
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs
FOR INSERT
WITH CHECK (true);

-- Allow admins to view all error logs
CREATE POLICY "Admins can view all error logs"
ON public.error_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create performance_metrics table for tracking page load times
CREATE TABLE public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  page_path text NOT NULL,
  load_time_ms integer,
  time_to_first_byte_ms integer,
  dom_content_loaded_ms integer,
  first_contentful_paint_ms integer,
  largest_contentful_paint_ms integer,
  user_agent text,
  connection_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for performance queries
CREATE INDEX idx_performance_metrics_date ON public.performance_metrics (created_at DESC);
CREATE INDEX idx_performance_metrics_page ON public.performance_metrics (page_path, created_at DESC);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert performance metrics
CREATE POLICY "Anyone can insert performance metrics"
ON public.performance_metrics
FOR INSERT
WITH CHECK (true);

-- Allow admins to view all performance metrics
CREATE POLICY "Admins can view all performance metrics"
ON public.performance_metrics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));