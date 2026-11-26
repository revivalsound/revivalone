-- Revival One: push notifications that reach a phone even when the app is closed.
-- Run once in the Supabase SQL Editor after follows.sql. Safe to re-run.
-- Then run the one-line insert into private.push_settings from your .env.local notes.

/* ── Devices that asked for push ── */

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "Members manage their devices" on public.push_subscriptions;
create policy "Members manage their devices" on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_subscriptions to authenticated;

/* ── Where to send: kept out of the public API ── */

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.push_settings (
  id integer primary key check (id = 1),
  endpoint text not null,
  secret text not null
);

/* ── Every new notification is handed to /api/push, which sends it to the member's devices ── */

create extension if not exists pg_net;

create or replace function public.push_notification()
returns trigger
language plpgsql
security definer set search_path = public, private
as $$
declare
  target record;
begin
  select endpoint, secret into target from private.push_settings where id = 1;
  -- Only members with a device signed up get a push.
  if target.endpoint is null or not exists (select 1 from public.push_subscriptions where user_id = new.user_id) then
    return new;
  end if;
  perform net.http_post(
    url := target.endpoint,
    headers := jsonb_build_object('content-type', 'application/json', 'x-push-secret', target.secret),
    body := jsonb_build_object('id', new.id, 'user_id', new.user_id, 'title', new.title, 'body', new.body, 'link', new.link, 'type', new.type)
  );
  return new;
end;
$$;

drop trigger if exists on_notification_push on public.notifications;
create trigger on_notification_push after insert on public.notifications for each row execute procedure public.push_notification();
