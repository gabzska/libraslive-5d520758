
-- Storage policies for the sinais-midia bucket (private bucket, open access for editing)
DROP POLICY IF EXISTS "sinais_midia_read" ON storage.objects;
CREATE POLICY "sinais_midia_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'sinais-midia');

DROP POLICY IF EXISTS "sinais_midia_insert" ON storage.objects;
CREATE POLICY "sinais_midia_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sinais-midia');

DROP POLICY IF EXISTS "sinais_midia_update" ON storage.objects;
CREATE POLICY "sinais_midia_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'sinais-midia');

DROP POLICY IF EXISTS "sinais_midia_delete" ON storage.objects;
CREATE POLICY "sinais_midia_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'sinais-midia');

-- Allow anon/auth to update sign rows so the admin page can attach media
GRANT UPDATE ON public.sinais TO anon, authenticated;

DROP POLICY IF EXISTS "sinais_update_public" ON public.sinais;
CREATE POLICY "sinais_update_public" ON public.sinais FOR UPDATE
  USING (true) WITH CHECK (true);
