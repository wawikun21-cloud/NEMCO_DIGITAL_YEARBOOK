CREATE TABLE IF NOT EXISTS public.memory_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date,
  event_time text,
  location text,
  description text,
  category text NOT NULL DEFAULT 'photo' CHECK (category IN ('photo', 'video', 'event', 'organization')),
  cover_image_url text,
  item_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_shared boolean NOT NULL DEFAULT false,
  visible_to text NOT NULL DEFAULT 'all' CHECK (visible_to IN ('all', 'section', 'batch', 'specific')),
  visible_to_section text,
  visible_to_batch text,
  visible_to_student_ids uuid[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.memory_albums(id) ON DELETE CASCADE,
  cloud_url text NOT NULL,
  thumbnail_url text,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  caption text,
  tagged_student_ids uuid[] DEFAULT '{}',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_favorites (
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memory_item_id uuid NOT NULL REFERENCES public.memory_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, memory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_albums_category ON public.memory_albums(category);
CREATE INDEX IF NOT EXISTS idx_memory_albums_created_by ON public.memory_albums(created_by);
CREATE INDEX IF NOT EXISTS idx_memory_albums_is_shared ON public.memory_albums(is_shared);
CREATE INDEX IF NOT EXISTS idx_memory_items_album_id ON public.memory_items(album_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_media_type ON public.memory_items(media_type);
CREATE INDEX IF NOT EXISTS idx_student_favorites_student_id ON public.student_favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_student_favorites_memory_item_id ON public.student_favorites(memory_item_id);

ALTER TABLE public.memory_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view shared albums or albums visible to them"
  ON public.memory_albums FOR SELECT
  USING (
    is_shared = true
    OR visible_to = 'all'
    OR (visible_to = 'section' AND visible_to_section = (SELECT section FROM public.profiles WHERE id = auth.uid()))
    OR (visible_to = 'batch' AND visible_to_batch = (SELECT year_level FROM public.profiles WHERE id = auth.uid()))
    OR (visible_to = 'specific' AND auth.uid() = ANY(visible_to_student_ids))
    OR created_by = auth.uid()
  );

CREATE POLICY "Admins can manage all albums"
  ON public.memory_albums FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Students can view items in visible albums"
  ON public.memory_items FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.memory_albums a
      WHERE a.id = memory_items.album_id
      AND (
        a.is_shared = true
        OR a.visible_to = 'all'
        OR (a.visible_to = 'section' AND a.visible_to_section = (SELECT section FROM public.profiles WHERE id = auth.uid()))
        OR (a.visible_to = 'batch' AND a.visible_to_batch = (SELECT year_level FROM public.profiles WHERE id = auth.uid()))
        OR (a.visible_to = 'specific' AND auth.uid() = ANY(a.visible_to_student_ids))
      )
    )
  );

CREATE POLICY "Admins can manage all items"
  ON public.memory_items FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Students can manage their own favorites"
  ON public.student_favorites FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
