-- Revival One profile and avatar upgrade
-- Safe to run more than once in the Supabase SQL Editor.

alter table public.profiles add column if not exists country text not null default '';
alter table public.profiles add column if not exists church text not null default '';
alter table public.profiles add column if not exists ministry_focus text not null default '';
alter table public.profiles add column if not exists bio text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
