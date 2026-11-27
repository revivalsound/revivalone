import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Thrown when supabase/follows.sql hasn't been run yet. */
export class SocialNotReady extends Error {
  constructor() { super('Following isn’t switched on yet. Run supabase/follows.sql in Supabase to turn it on.') }
}

function fail(error: { code?: string; message: string }): never {
  if (['PGRST205', '42P01', '42703'].includes(error.code ?? '')) throw new SocialNotReady()
  throw new Error(error.message)
}

/* ── Follows ── */

export type Person = { id: string; full_name: string; avatar_url: string | null; city: string; church: string }
const PERSON = 'id, full_name, avatar_url, city, church'

export async function isFollowing(me: string, them: string) {
  const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', me).eq('followee_id', them).maybeSingle()
  if (error) fail(error)
  return Boolean(data)
}

export async function follow(me: string, them: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: me, followee_id: them })
  if (error && error.code !== '23505') fail(error)
}

export async function unfollow(me: string, them: string) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', them)
  if (error) fail(error)
}

export async function followCounts(id: string) {
  const count = async (column: 'follower_id' | 'followee_id') => {
    const { count: value, error } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq(column, id)
    return error ? null : value ?? 0
  }
  const [followers, following] = await Promise.all([count('followee_id'), count('follower_id')])
  return { followers, following }
}

/** People who follow someone, or whom someone follows. */
export async function fetchPeople(id: string, which: 'followers' | 'following') {
  const query = which === 'followers'
    ? supabase.from('follows').select(`created_at, person:profiles!follows_follower_id_fkey(${PERSON})`).eq('followee_id', id)
    : supabase.from('follows').select(`created_at, person:profiles!follows_followee_id_fkey(${PERSON})`).eq('follower_id', id)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
  if (error) fail(error)
  return (data ?? []).map((row: any) => row.person as Person).filter(Boolean)
}

/** Everyone you follow, for the Following feed and follow buttons. */
export async function fetchFollowingIds(me: string) {
  const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', me).limit(1000)
  if (error) fail(error)
  return (data ?? []).map(row => row.followee_id as string)
}

/** Members you don't follow yet, newest first: for "People to follow". */
export async function fetchSuggestedPeople(me: string, limit = 8) {
  const [{ data, error }, following] = await Promise.all([
    supabase.from('profiles').select(PERSON).neq('id', me).order('created_at', { ascending: false }).limit(60),
    fetchFollowingIds(me).catch(() => [] as string[]),
  ])
  if (error) fail(error)
  const skip = new Set(following)
  return ((data ?? []) as Person[]).filter(person => !skip.has(person.id) && person.full_name).slice(0, limit)
}

/* ── Notifications ── */

export type NotificationType = 'follow' | 'post' | 'prayer_wall' | 'cell' | 'cell_nearby' | 'mention'
export type AppNotification = {
  id: string; type: NotificationType; title: string; body: string; link: string; read_at: string | null; created_at: string
  actor: { id: string; full_name: string; avatar_url: string | null } | null
}

const NOTE = 'id, type, title, body, link, read_at, created_at, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)'

export async function fetchNotifications(me: string, limit = 60) {
  const { data, error } = await supabase.from('notifications').select(NOTE).eq('user_id', me).order('created_at', { ascending: false }).limit(limit)
  if (error) fail(error)
  return (data ?? []) as unknown as AppNotification[]
}

export async function fetchNotification(id: string) {
  const { data } = await supabase.from('notifications').select(NOTE).eq('id', id).maybeSingle()
  return data as unknown as AppNotification | null
}

export async function unreadCount(me: string) {
  const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', me).is('read_at', null)
  if (error) return 0
  return count ?? 0
}

export async function markRead(ids: string[]) {
  if (!ids.length) return
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
}

export async function markAllRead(me: string) {
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me).is('read_at', null)
}

let notificationChannelInstance = 0

export function subscribeToNotifications(me: string, onNew: (id: string) => void): RealtimeChannel {
  return supabase
    // Channel removal is asynchronous, so a rapid remount needs a fresh topic.
    .channel(`notifications:${me}:${++notificationChannelInstance}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` }, payload => onNew((payload.new as { id: string }).id))
    .subscribe()
}
