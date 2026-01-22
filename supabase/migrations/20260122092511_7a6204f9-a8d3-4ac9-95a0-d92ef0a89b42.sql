-- Add location columns to profiles for drivers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_lat numeric,
ADD COLUMN IF NOT EXISTS location_lng numeric,
ADD COLUMN IF NOT EXISTS location_address text;

-- Create a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 numeric, lng1 numeric,
  lat2 numeric, lng2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  r numeric := 6371; -- Earth's radius in kilometers
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  -- Return NULL if any coordinate is missing
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlng / 2) * sin(dlng / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN r * c;
END;
$function$;

-- Update the notification function to filter by distance (10km radius)
CREATE OR REPLACE FUNCTION public.notify_drivers_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _driver RECORD;
  _item_title text;
  _item_category text;
  _radius_km numeric := 10; -- 10km radius for notifications
BEGIN
  -- Only notify for non-draft, active reports
  IF NEW.is_draft = true OR NEW.status != 'active' THEN
    RETURN NEW;
  END IF;
  
  _item_title := NEW.title;
  _item_category := NEW.category::text;
  
  -- Notify verified drivers who are online and within radius (or all if no location set)
  FOR _driver IN 
    SELECT p.user_id 
    FROM public.profiles p
    WHERE p.user_type = 'driver' 
      AND p.is_verified = true
      AND p.is_online = true
      AND p.user_id != NEW.user_id
      AND (
        -- If lost item has no location, notify all drivers
        NEW.lost_location_lat IS NULL OR NEW.lost_location_lng IS NULL
        -- If driver has no location set, include them
        OR p.location_lat IS NULL OR p.location_lng IS NULL
        -- Otherwise, check if within radius
        OR public.calculate_distance_km(
            NEW.lost_location_lat, NEW.lost_location_lng,
            p.location_lat, p.location_lng
          ) <= _radius_km
      )
  LOOP
    PERFORM public.create_notification(
      _driver.user_id,
      'New Lost Item Nearby',
      'Someone lost a ' || _item_category || ': ' || _item_title,
      'report',
      '/driver/reports',
      jsonb_build_object(
        'lost_item_id', NEW.id,
        'category', _item_category,
        'location', NEW.lost_location_address
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Update the published report notification function as well
CREATE OR REPLACE FUNCTION public.notify_drivers_report_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _driver RECORD;
  _item_title text;
  _item_category text;
  _radius_km numeric := 10; -- 10km radius for notifications
BEGIN
  -- Only notify when changing from draft to published active report
  IF OLD.is_draft = true AND NEW.is_draft = false AND NEW.status = 'active' THEN
    _item_title := NEW.title;
    _item_category := NEW.category::text;
    
    -- Notify verified drivers who are online and within radius
    FOR _driver IN 
      SELECT p.user_id 
      FROM public.profiles p
      WHERE p.user_type = 'driver' 
        AND p.is_verified = true
        AND p.is_online = true
        AND p.user_id != NEW.user_id
        AND (
          NEW.lost_location_lat IS NULL OR NEW.lost_location_lng IS NULL
          OR p.location_lat IS NULL OR p.location_lng IS NULL
          OR public.calculate_distance_km(
              NEW.lost_location_lat, NEW.lost_location_lng,
              p.location_lat, p.location_lng
            ) <= _radius_km
        )
    LOOP
      PERFORM public.create_notification(
        _driver.user_id,
        'New Lost Item Nearby',
        'Someone lost a ' || _item_category || ': ' || _item_title,
        'report',
        '/driver/reports',
        jsonb_build_object(
          'lost_item_id', NEW.id,
          'category', _item_category,
          'location', NEW.lost_location_address
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;