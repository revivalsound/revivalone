-- Revival One: the Home feed (posts) and public profiles.
-- Run once in the Supabase SQL Editor for project yvahpzbkxpgjufnxrisc. Safe to re-run.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('word','study','question','opportunity')),
  opportunity_type text check (opportunity_type in ('job','business','investment','ministry','volunteer','other')),
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 10 and 10000),
  scripture text not null default '' check (char_length(scripture) <= 80),
  link_url text not null default '' check (link_url = '' or link_url ~* '^https?://'),
  tags text[] not null default '{}' check (cardinality(tags) <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'opportunity' or opportunity_type is null)
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);
create index if not exists posts_kind_idx on public.posts (kind, created_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);

alter table public.posts enable row level security;

drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable" on public.posts for select using (true);
drop policy if exists "Members write their own posts" on public.posts;
create policy "Members write their own posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Authors edit their posts" on public.posts;
create policy "Authors edit their posts" on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "Authors delete their posts" on public.posts;
create policy "Authors delete their posts" on public.posts for delete to authenticated using (auth.uid() = author_id);

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

-- Profiles are already publicly readable (schema.sql); these columns power public profile pages.
alter table public.profiles add column if not exists country text not null default '';
alter table public.profiles add column if not exists church text not null default '';
alter table public.profiles add column if not exists ministry_focus text not null default '';
alter table public.profiles add column if not exists bio text not null default '';
