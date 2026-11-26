-- Revival One: formatted text and photos/videos on posts.
-- Run once in the Supabase SQL Editor after posts.sql and community.sql. Safe to re-run.

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

-- Photos and videos go in the media bucket that community.sql created.
