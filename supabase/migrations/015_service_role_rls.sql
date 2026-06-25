DROP POLICY IF EXISTS "service_role can manage all profiles" ON public.profiles;

CREATE POLICY "service_role can manage all profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role can manage all import_batches" ON public.import_batches;

CREATE POLICY "service_role can manage all import_batches"
  ON public.import_batches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role can manage all import_errors" ON public.import_errors;

CREATE POLICY "service_role can manage all import_errors"
  ON public.import_errors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
