-- Revival One: cell group chat, live prayer walls, and media for created events,
-- bootcamps and cells. Run once in the Supabase SQL Editor after schema.sql.
-- Safe to re-run.

/* ── Initiatives: cover media and type-specific details ── */

alter table public.initiatives add column if not exists media_url text not null default '';
alter table public.initiatives add column if not exists media_type text not null default '';
alter table public.initiatives add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.initiatives drop constraint if exists initiatives_media_type_check;
alter table public.initiatives add constraint initiatives_media_type_check check (media_type in ('', 'image', 'video'));
alter table public.initiatives drop constraint if exists initiatives_description_check;
alter table public.initiatives add constraint initiatives_description_check check (char_length(description) between 10 and 4000);

-- Whoever starts a cell leads it, so they can use its chat straight away.
create or replace function public.add_cell_leader()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.kind = 'cell' then
    insert into public.community_memberships (cell_id, user_id, role)
    values (new.id, new.owner_id, 'leader')
    on conflict (cell_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_cell_created on public.initiatives;
create trigger on_cell_created after insert on public.initiatives for each row execute procedure public.add_cell_leader();

/* ── Cell group chat ── */

create table if not exists public.cell_messages (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.initiatives(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists cell_messages_cell_idx on public.cell_messages (cell_id, created_at desc);

alter table public.cell_messages enable row level security;

create or replace function public.is_cell_member(cell uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.community_memberships where cell_id = cell and user_id = auth.uid());
$$;

drop policy if exists "Members read their cell chat" on public.cell_messages;
create policy "Members read their cell chat" on public.cell_messages for select to authenticated using (public.is_cell_member(cell_id));
drop policy if exists "Members post in their cell chat" on public.cell_messages;
create policy "Members post in their cell chat" on public.cell_messages for insert to authenticated with check (author_id = auth.uid() and public.is_cell_member(cell_id));
drop policy if exists "Authors delete their messages" on public.cell_messages;
create policy "Authors delete their messages" on public.cell_messages for delete to authenticated using (author_id = auth.uid());

grant select, insert, delete on public.cell_messages to authenticated;

-- Live updates for the chat.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cell_messages') then
    alter publication supabase_realtime add table public.cell_messages;
  end if;
end $$;

/* ── Prayer walls: live audio rooms (LiveKit) with a purpose and a time frame ── */

create table if not exists public.prayer_walls (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z]{3}-[a-z]{4}-[a-z]{3}$'),
  title text not null check (char_length(title) between 3 and 120),
  purpose text not null default '' check (char_length(purpose) <= 1000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '24 hours')
);
create index if not exists prayer_walls_time_idx on public.prayer_walls (ends_at, starts_at);

alter table public.prayer_walls enable row level security;

drop policy if exists "Prayer walls are readable" on public.prayer_walls;
create policy "Prayer walls are readable" on public.prayer_walls for select using (true);
drop policy if exists "Members host prayer walls" on public.prayer_walls;
create policy "Members host prayer walls" on public.prayer_walls for insert to authenticated with check (host_id = auth.uid());
drop policy if exists "Hosts edit prayer walls" on public.prayer_walls;
create policy "Hosts edit prayer walls" on public.prayer_walls for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
drop policy if exists "Hosts delete prayer walls" on public.prayer_walls;
create policy "Hosts delete prayer walls" on public.prayer_walls for delete to authenticated using (host_id = auth.uid());

grant select on public.prayer_walls to anon, authenticated;
grant insert, update, delete on public.prayer_walls to authenticated;

/* ── Media bucket for cover images and videos ── */

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
