-- Revival One: follow preachers, teachers and members, and get notified.
-- Run once in the Supabase SQL Editor after posts.sql and community.sql. Safe to re-run.

create extension if not exists pg_trgm;

-- A city, ready to compare: lower case, letters only.
create or replace function public.city_key(value text)
returns text language sql immutable as $$
  select regexp_replace(lower(coalesce(value, '')), '[^a-z]', '', 'g');
$$;

/* ── Follows ── */

create table if not exists public.follows (
  follower_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;
drop policy if exists "Follows are public" on public.follows;
create policy "Follows are public" on public.follows for select using (true);
drop policy if exists "Members follow" on public.follows;
create policy "Members follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists "Members unfollow" on public.follows;
create policy "Members unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

/* ── Notifications (written only by the triggers below) ── */

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow', 'post', 'prayer_wall', 'cell', 'cell_nearby')),
  title text not null,
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "Members read their notifications" on public.notifications;
create policy "Members read their notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "Members mark their notifications" on public.notifications;
create policy "Members mark their notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Members clear their notifications" on public.notifications;
create policy "Members clear their notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());
grant select, update, delete on public.notifications to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.display_name(member uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(full_name, ''), 'A Revival One member') from public.profiles where id = member;
$$;

-- Someone followed you.
create or replace function public.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, link)
  values (new.followee_id, new.follower_id, 'follow', public.display_name(new.follower_id) || ' started following you', '/u/' || new.follower_id);
  return new;
end;
$$;
drop trigger if exists on_follow on public.follows;
create trigger on_follow after insert on public.follows for each row execute procedure public.notify_follow();

-- Someone you follow posted.
create or replace function public.notify_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body, link)
  select f.follower_id, new.author_id, 'post', public.display_name(new.author_id) || ' shared a new ' ||
         case new.kind when 'word' then 'word' when 'study' then 'study' when 'question' then 'question' else 'opportunity' end,
         new.title, '/post/' || new.id
  from public.follows f where f.followee_id = new.author_id;
  return new;
end;
$$;
drop trigger if exists on_post_notify on public.posts;
create trigger on_post_notify after insert on public.posts for each row execute procedure public.notify_post();

-- Someone you follow started or scheduled a prayer wall.
create or replace function public.notify_prayer_wall()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body, link)
  select f.follower_id, new.host_id, 'prayer_wall',
         public.display_name(new.host_id) || case when new.starts_at <= now() + interval '2 minutes' then ' started a prayer wall' else ' scheduled a prayer wall' end,
         new.title, '/prayer/' || new.code
  from public.follows f where f.followee_id = new.host_id;
  return new;
end;
$$;
drop trigger if exists on_prayer_wall_notify on public.prayer_walls;
create trigger on_prayer_wall_notify after insert on public.prayer_walls for each row execute procedure public.notify_prayer_wall();

-- A new cell: tell the creator's followers, and members who live in the same city.
create or replace function public.notify_cell()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind <> 'cell' or new.status <> 'published' then return new; end if;

  insert into public.notifications (user_id, actor_id, type, title, body, link)
  select f.follower_id, new.owner_id, 'cell', public.display_name(new.owner_id) || ' started a revival cell', new.title, '/community/cells/' || new.id
  from public.follows f where f.followee_id = new.owner_id;

  if coalesce(new.city, '') <> '' and lower(new.city) <> 'online' then
    insert into public.notifications (user_id, actor_id, type, title, body, link)
    select p.id, new.owner_id, 'cell_nearby', 'A new revival cell in ' || new.city, new.title, '/community/cells/' || new.id
    from public.profiles p
    -- Forgiving of spaces and small spelling differences ("Portharcort" ~ "Port Harcourt").
    where coalesce(p.city, '') <> ''
      and similarity(public.city_key(p.city), public.city_key(new.city)) >= 0.5
      and p.id <> new.owner_id
      and not exists (select 1 from public.follows f where f.followee_id = new.owner_id and f.follower_id = p.id);
  end if;
  return new;
end;
$$;
drop trigger if exists on_cell_notify on public.initiatives;
create trigger on_cell_notify after insert on public.initiatives for each row execute procedure public.notify_cell();
