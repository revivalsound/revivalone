-- REST post likes and comments. Run after posts.sql; safe to re-run.
begin;
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_created_idx on public.post_comments(post_id, created_at);
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
drop policy if exists "Read post likes" on public.post_likes;
create policy "Read post likes" on public.post_likes for select using (true);
drop policy if exists "Like as yourself" on public.post_likes;
create policy "Like as yourself" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Unlike as yourself" on public.post_likes;
create policy "Unlike as yourself" on public.post_likes for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Read post comments" on public.post_comments;
create policy "Read post comments" on public.post_comments for select using (true);
drop policy if exists "Comment as yourself" on public.post_comments;
create policy "Comment as yourself" on public.post_comments for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Delete your comment" on public.post_comments;
create policy "Delete your comment" on public.post_comments for delete to authenticated using (auth.uid() = author_id);
grant select on public.post_likes, public.post_comments to anon, authenticated;
grant insert, delete on public.post_likes, public.post_comments to authenticated;

create or replace function public.post_engagement(post_ids uuid[])
returns table(post_id uuid, likes bigint, comments bigint, liked boolean)
language sql stable security invoker set search_path = '' as $$
  select p.id,
    (select count(*) from public.post_likes l where l.post_id = p.id),
    (select count(*) from public.post_comments c where c.post_id = p.id),
    exists(select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid())
  from public.posts p where p.id = any(post_ids) limit 100;
$$;
revoke all on function public.post_engagement(uuid[]) from public;
grant execute on function public.post_engagement(uuid[]) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
