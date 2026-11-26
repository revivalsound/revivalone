-- Revival One: cover photos and a website link on member profiles.
-- Run once in the Supabase SQL Editor. Safe to re-run.

alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists website text not null default '';
alter table public.profiles drop constraint if exists profiles_website_check;
alter table public.profiles add constraint profiles_website_check check (website = '' or website ~* '^https?://');

-- Cover photos use the avatars bucket, in the member's own folder (profile-upgrade.sql);
-- allow a little more room for wide images.
update storage.buckets set file_size_limit = 5242880 where id = 'avatars';
