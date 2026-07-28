-- Revival One database schema for Supabase
-- Run this file once in the Supabase SQL Editor for project yvahpzbkxpgjufnxrisc.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  city text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('event','bootcamp','cell')),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 1000),
  city text not null,
  starts_at date not null,
  status text not null default 'draft' check (status in ('draft','published','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  event_id uuid not null references public.initiatives(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.community_memberships (
  cell_id uuid not null references public.initiatives(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('leader','host','member')),
  created_at timestamptz not null default now(),
  primary key (cell_id, user_id)
);

create table if not exists public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text not null,
  lesson_count integer not null default 0 check (lesson_count >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.course_enrollments (
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, city)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'city',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.initiatives enable row level security;
alter table public.event_registrations enable row level security;
alter table public.community_memberships enable row level security;
alter table public.academy_courses enable row level security;
alter table public.course_enrollments enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Published initiatives are readable" on public.initiatives;
create policy "Published initiatives are readable" on public.initiatives for select using (status = 'published' or auth.uid() = owner_id);
drop policy if exists "Users create their own initiatives" on public.initiatives;
create policy "Users create their own initiatives" on public.initiatives for insert with check (auth.uid() = owner_id);
drop policy if exists "Owners update initiatives" on public.initiatives;
create policy "Owners update initiatives" on public.initiatives for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Owners delete initiatives" on public.initiatives;
create policy "Owners delete initiatives" on public.initiatives for delete using (auth.uid() = owner_id);

drop policy if exists "Users read registrations" on public.event_registrations;
create policy "Users read registrations" on public.event_registrations for select using (auth.uid() = user_id);
drop policy if exists "Users register themselves" on public.event_registrations;
create policy "Users register themselves" on public.event_registrations for insert with check (auth.uid() = user_id);
drop policy if exists "Users cancel registration" on public.event_registrations;
create policy "Users cancel registration" on public.event_registrations for delete using (auth.uid() = user_id);

drop policy if exists "Memberships are readable" on public.community_memberships;
create policy "Memberships are readable" on public.community_memberships for select using (true);
drop policy if exists "Users join cells" on public.community_memberships;
create policy "Users join cells" on public.community_memberships for insert with check (auth.uid() = user_id);
drop policy if exists "Users leave cells" on public.community_memberships;
create policy "Users leave cells" on public.community_memberships for delete using (auth.uid() = user_id);

drop policy if exists "Published courses are readable" on public.academy_courses;
create policy "Published courses are readable" on public.academy_courses for select using (published = true);
drop policy if exists "Users read their enrollments" on public.course_enrollments;
create policy "Users read their enrollments" on public.course_enrollments for select using (auth.uid() = user_id);
drop policy if exists "Users enroll themselves" on public.course_enrollments;
create policy "Users enroll themselves" on public.course_enrollments for insert with check (auth.uid() = user_id);
drop policy if exists "Users update their progress" on public.course_enrollments;
create policy "Users update their progress" on public.course_enrollments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.initiatives, public.community_memberships, public.academy_courses to anon, authenticated;
grant insert, update, delete on public.initiatives, public.event_registrations, public.community_memberships, public.course_enrollments to authenticated;
grant update on public.profiles to authenticated;

insert into public.academy_courses (title, slug, category, description, lesson_count, published)
values
  ('Built in the Secret Place','built-in-the-secret-place','Spiritual Formation','Build a durable life of prayer, scripture, and abiding.',8,true),
  ('Leading with Fire','leading-with-fire','Leadership','Lead people with conviction, humility, and spiritual clarity.',10,true),
  ('Kingdom Enterprise','kingdom-enterprise','Business','Turn a God-given burden into an enterprise that serves people.',12,true)
on conflict (slug) do nothing;
