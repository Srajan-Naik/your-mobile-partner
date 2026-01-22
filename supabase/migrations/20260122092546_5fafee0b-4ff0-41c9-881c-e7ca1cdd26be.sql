-- Fix the calculate_distance_km function to have search_path set
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 numeric, lng1 numeric,
  lat2 numeric, lng2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
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