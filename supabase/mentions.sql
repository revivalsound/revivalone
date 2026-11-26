-- Revival One: tag people with @ in posts, and tell them.
-- Run once in the Supabase SQL Editor after follows.sql. Safe to re-run.

alter table public.posts add column if not exists mentions uuid[] not null default '{}';
alter table public.posts drop constraint if exists posts_mentions_check;
alter table public.posts add constraint posts_mentions_check check (cardinality(mentions) <= 20);

-- Allow the new kind of notification.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('follow', 'post', 'prayer_wall', 'cell', 'cell_nearby', 'mention'));

-- Someone tagged you in a post.
create or replace function public.notify_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body, link)
  select distinct m.id, new.author_id, 'mention', public.display_name(new.author_id) || ' tagged you in a post', new.title, '/post/' || new.id
  from unnest(new.mentions) as m(id)
  where m.id <> new.author_id and exists (select 1 from public.profiles p where p.id = m.id);
  return new;
end;
$$;
drop trigger if exists on_post_mentions on public.posts;
create trigger on_post_mentions after insert on public.posts for each row execute procedure public.notify_mentions();

-- Followers who were also tagged get the "tagged you" notification instead of a second one.
create or replace function public.notify_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body, link)
  select f.follower_id, new.author_id, 'post', public.display_name(new.author_id) || ' shared a new ' ||
         case new.kind when 'word' then 'word' when 'study' then 'study' when 'question' then 'question' else 'opportunity' end,
         new.title, '/post/' || new.id
  from public.follows f
  where f.followee_id = new.author_id and not (f.follower_id = any(new.mentions));
  return new;
end;
$$;
