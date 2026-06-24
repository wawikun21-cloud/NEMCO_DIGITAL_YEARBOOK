ALTER TABLE public.memory_albums ADD COLUMN IF NOT EXISTS album_link text;
ALTER TABLE public.memory_albums ADD COLUMN IF NOT EXISTS image_url_2 text;
ALTER TABLE public.memory_albums ADD COLUMN IF NOT EXISTS image_url_3 text;
ALTER TABLE public.memory_albums ADD COLUMN IF NOT EXISTS image_url_4 text;

CREATE INDEX IF NOT EXISTS idx_memory_albums_album_link ON public.memory_albums(album_link) WHERE album_link IS NOT NULL;
