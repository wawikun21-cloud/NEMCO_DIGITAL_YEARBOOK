ALTER TABLE public.student_favorites ADD COLUMN IF NOT EXISTS memory_album_id uuid REFERENCES public.memory_albums(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_student_favorites_memory_album_id ON public.student_favorites(memory_album_id);

CREATE POLICY "Students can manage their own album favorites"
  ON public.student_favorites FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
