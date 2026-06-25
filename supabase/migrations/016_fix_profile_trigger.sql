CREATE OR REPLACE FUNCTION public.protect_profile_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL
    AND NOT public.is_admin()
    AND (
      NEW.role IS DISTINCT FROM OLD.role
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.student_number IS DISTINCT FROM OLD.student_number
      OR NEW.email IS DISTINCT FROM OLD.email
    )
  THEN
    RAISE EXCEPTION 'Only admins can change protected profile fields';
  END IF;

  RETURN NEW;
END;
$$;
