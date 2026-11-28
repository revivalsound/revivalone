-- Revival One: formatted text and photos/videos on posts.
-- Run once in the Supabase SQL Editor after posts.sql and community.sql. Safe to re-run.

begin;

-- The formatted post (sanitised HTML from the editor). `body` keeps a plain-text copy for previews and search.
alter table public.posts add column if not exists body_html text not null default '';
alter table public.posts drop constraint if exists posts_body_html_check;
alter table public.posts add constraint posts_body_html_check check (char_length(body_html) <= 100000);

-- Up to six photos or videos: [{ "url": "...", "type": "image" | "video" }]
alter table public.posts add column if not exists media jsonb not null default '[]'::jsonb;
alter table public.posts drop constraint if exists posts_media_check;
alter table public.posts add constraint posts_media_check check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 6);

-- Posts can be just a title and a photo, so the text can be short.
alter table public.posts drop constraint if exists posts_body_check;
alter table public.posts add constraint posts_body_check check (char_length(body) <= 20000);

-- Ensure the shared media bucket exists even if community.sql was not run.
-- Public posts use public URLs; uploads/deletes remain scoped to the member's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Media is publicly readable" on storage.objects;
create policy "Media is publicly readable" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "Members upload their own media" on storage.objects;
create policy "Members upload their own media" on storage.objects for insert to authenticated
with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete their own media" on storage.objects;
create policy "Members delete their own media" on storage.objects for delete to authenticated
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Make the new columns available to the API immediately.
notify pgrst, 'reload schema';
commit;
