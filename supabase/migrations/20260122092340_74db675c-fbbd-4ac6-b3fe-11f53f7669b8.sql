-- Create a function to notify drivers when a new lost item is reported
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
BEGIN
  -- Only notify for non-draft, active reports
  IF NEW.is_draft = true OR NEW.status != 'active' THEN
    RETURN NEW;
  END IF;
  
  _item_title := NEW.title;
  _item_category := NEW.category::text;
  
  -- Notify all online verified drivers
  FOR _driver IN 
    SELECT p.user_id 
    FROM public.profiles p
    WHERE p.user_type = 'driver' 
      AND p.is_verified = true
      AND p.is_online = true
      AND p.user_id != NEW.user_id
  LOOP
    PERFORM public.create_notification(
      _driver.user_id,
      'New Lost Item Report',
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

-- Create trigger for new lost item reports
DROP TRIGGER IF EXISTS on_new_lost_item_notify_drivers ON public.lost_items;
CREATE TRIGGER on_new_lost_item_notify_drivers
  AFTER INSERT ON public.lost_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_drivers_new_report();

-- Also trigger when a draft is published (updated to non-draft active status)
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
BEGIN
  -- Only notify when changing from draft to published active report
  IF OLD.is_draft = true AND NEW.is_draft = false AND NEW.status = 'active' THEN
    _item_title := NEW.title;
    _item_category := NEW.category::text;
    
    -- Notify all online verified drivers
    FOR _driver IN 
      SELECT p.user_id 
      FROM public.profiles p
      WHERE p.user_type = 'driver' 
        AND p.is_verified = true
        AND p.is_online = true
        AND p.user_id != NEW.user_id
    LOOP
      PERFORM public.create_notification(
        _driver.user_id,
        'New Lost Item Report',
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

-- Create trigger for published reports
DROP TRIGGER IF EXISTS on_lost_item_published_notify_drivers ON public.lost_items;
CREATE TRIGGER on_lost_item_published_notify_drivers
  AFTER UPDATE ON public.lost_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_drivers_report_published();