-- Revival One: Bible reading, the daily guide, and member-made Rev Academy courses.
-- Run once in the Supabase SQL Editor after community.sql. Safe to re-run.

/* ── Highlights and notes on verses ── */

create table if not exists public.bible_highlights (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  book text not null check (book ~ '^[1-3A-Z]{3}$'),
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  color text not null default 'pink' check (color in ('pink', 'gold', 'lilac', 'sky', 'none')),
  note text not null default '' check (char_length(note) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, book, chapter, verse)
);

alter table public.bible_highlights enable row level security;
drop policy if exists "Members manage their highlights" on public.bible_highlights;
create policy "Members manage their highlights" on public.bible_highlights for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.bible_highlights to authenticated;

/* ── Daily Bible guide progress and journal ── */

create table if not exists public.guide_progress (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  year integer not null check (year between 2000 and 2200),
  day integer not null check (day between 1 and 365),
  readings text[] not null default '{}',
  completed_at timestamptz,
  reflection text not null default '' check (char_length(reflection) <= 5000),
  prayer text not null default '' check (char_length(prayer) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, year, day)
);

alter table public.guide_progress enable row level security;
drop policy if exists "Members manage their guide progress" on public.guide_progress;
create policy "Members manage their guide progress" on public.guide_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.guide_progress to authenticated;

/* ── Rev Academy: audio courses made by members ── */

alter table public.academy_courses add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.academy_courses alter column owner_id set default auth.uid();
alter table public.academy_courses add column if not exists teacher text not null default '';
alter table public.academy_courses add column if not exists cover_url text not null default '';

-- schema.sql used to seed three demo courses with no owner; remove them.
delete from public.academy_courses where owner_id is null;

drop policy if exists "Published courses are readable" on public.academy_courses;
create policy "Published courses are readable" on public.academy_courses for select using (published = true or owner_id = auth.uid());
drop policy if exists "Members create courses" on public.academy_courses;
create policy "Members create courses" on public.academy_courses for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "Owners edit courses" on public.academy_courses;
create policy "Owners edit courses" on public.academy_courses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Owners delete courses" on public.academy_courses;
create policy "Owners delete courses" on public.academy_courses for delete to authenticated using (owner_id = auth.uid());
grant insert, update, delete on public.academy_courses to authenticated;

create table if not exists public.academy_episodes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  number integer not null check (number > 0),
  title text not null check (char_length(title) between 2 and 140),
  summary text not null default '' check (char_length(summary) <= 1000),
  audio_url text not null check (audio_url ~* '^https?://'),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, number)
);

alter table public.academy_episodes enable row level security;
drop policy if exists "Episodes of readable courses are readable" on public.academy_episodes;
create policy "Episodes of readable courses are readable" on public.academy_episodes for select using (
  exists (select 1 from public.academy_courses c where c.id = course_id and (c.published or c.owner_id = auth.uid()))
);
drop policy if exists "Course owners manage episodes" on public.academy_episodes;
create policy "Course owners manage episodes" on public.academy_episodes for all to authenticated
using (exists (select 1 from public.academy_courses c where c.id = course_id and c.owner_id = auth.uid()))
with check (exists (select 1 from public.academy_courses c where c.id = course_id and c.owner_id = auth.uid()));
grant select on public.academy_episodes to anon, authenticated;
grant insert, update, delete on public.academy_episodes to authenticated;

create table if not exists public.academy_progress (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  done integer[] not null default '{}',
  current integer not null default 1,
  position real not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.academy_progress enable row level security;
drop policy if exists "Members manage their course progress" on public.academy_progress;
create policy "Members manage their course progress" on public.academy_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.academy_progress to authenticated;

/* ── Let the media bucket take course audio as well ── */

update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/x-m4a','audio/aac','audio/wav','audio/ogg','audio/webm']
where id = 'media';
