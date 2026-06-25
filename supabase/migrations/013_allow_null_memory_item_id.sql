ALTER TABLE public.student_favorites DROP CONSTRAINT IF EXISTS student_favorites_pkey;

ALTER TABLE public.student_favorites ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

UPDATE public.student_favorites SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE public.student_favorites ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.student_favorites ADD PRIMARY KEY (id);

ALTER TABLE public.student_favorites ALTER COLUMN memory_item_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_favorites_unique_item
  ON public.student_favorites (student_id, memory_item_id)
  WHERE memory_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_favorites_unique_album
  ON public.student_favorites (student_id, memory_album_id)
  WHERE memory_album_id IS NOT NULL;
