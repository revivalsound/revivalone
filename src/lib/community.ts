import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { CELLS, EVENTS } from './content'

/* ── Initiatives: events, gospel bootcamps and revival cells ── */

export type InitiativeKind = 'event' | 'bootcamp' | 'cell'
export type Format = 'in_person' | 'online' | 'hybrid'

export type EventDetails = { category: string; format: Format; venue: string; online_link: string; start_time: string; end_time: string; capacity: number | null }
export type BootcampDetails = { track: string; format: Format; venue: string; weeks: number; days: string[]; start_time: string; capacity: number | null; outcomes: string[] }
export type CellDetails = { focus: string; area: string; format: Format; meeting_day: string; start_time: string; max_members: number | null }

export type Initiative<K extends InitiativeKind = InitiativeKind> = {
  id: string
  owner_id: string
  kind: K
  title: string
  description: string
  city: string
  starts_at: string
  status: string
  media_url: string
  media_type: '' | 'image' | 'video'
  details: K extends 'event' ? Partial<EventDetails> : K extends 'bootcamp' ? Partial<BootcampDetails> : Partial<CellDetails>
  created_at: string
  /** Set on example listings that aren't stored in Supabase. */
  example?: boolean
  member_count?: number
}

export const FORMAT_LABEL: Record<Format, string> = { in_person: 'In person', online: 'Online', hybrid: 'Hybrid' }

/** Thrown when supabase/community.sql hasn't been run yet. */
export class CommunityNotReady extends Error {
  constructor() { super('This part of Revival One isn’t switched on yet. Run supabase/community.sql in Supabase to turn it on.') }
}

function fail(error: { code?: string; message: string }): never {
  if (['PGRST205', '42P01', '42703', 'PGRST204'].includes(error.code ?? '')) throw new CommunityNotReady()
  throw new Error(error.message)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (id: string) => UUID.test(id)

const INITIATIVE = 'id, owner_id, kind, title, description, city, starts_at, status, media_url, media_type, details, created_at'

/* Example listings, shown alongside real ones so the screens aren't empty on day one. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function exampleDate(label: string) {
  const [month, day] = label.split(' ')
  const now = new Date()
  const date = new Date(now.getFullYear(), MONTHS.indexOf(month), Number(day))
  if (date.getTime() < now.getTime() - 86_400_000) date.setFullYear(date.getFullYear() + 1)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const EXAMPLE_EVENTS: Initiative<'event' | 'bootcamp'>[] = EVENTS.map((event, index) => ({
  id: `example-event-${index}`,
  owner_id: '',
  kind: event.category === 'Gospel bootcamp' ? 'bootcamp' : 'event',
  title: event.title,
  description: `${event.category} with the Revival One community.`,
  city: event.place.split(' · ').pop() ?? event.place,
  starts_at: exampleDate(event.date),
  status: 'published',
  media_url: '',
  media_type: '',
  details: { category: event.category, format: event.online ? 'online' : 'in_person', venue: event.place.split(' · ')[0], start_time: event.time.replace(' WAT', '') } as Partial<EventDetails>,
  created_at: '2026-01-01T00:00:00Z',
  example: true,
}))

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Only used in local development, before community.sql has been run, so the chat can be previewed.
export const SAMPLE_CELLS: Initiative<'cell'>[] = CELLS.map((cell, index) => {
  const [day, time] = cell.schedule.split(' · ')
  return {
    id: `sample-cell-${index}`,
    owner_id: '',
    kind: 'cell',
    title: cell.name,
    description: `A ${cell.focus.toLowerCase()} cell meeting in ${cell.city}. Come as you are.`,
    city: cell.city,
    starts_at: '2026-01-01',
    status: 'published',
    media_url: '',
    media_type: '',
    details: { focus: cell.focus, area: cell.name.replace(/ (Cell|Fellowship|Revival Cell)$/, ''), format: 'in_person', meeting_day: DAYS.find(name => day.startsWith(name.slice(0, 3))) ?? day, start_time: time },
    created_at: '2026-01-01T00:00:00Z',
    example: true,
    member_count: cell.members,
  }
})

async function devFallback<T>(load: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await load()
  } catch (error) {
    if (import.meta.env.DEV && error instanceof CommunityNotReady) return fallback()
    throw error
  }
}

export function fetchCells() {
  return devFallback(async () => {
    const { data, error } = await supabase.from('initiatives').select(`${INITIATIVE}, community_memberships(count)`).eq('kind', 'cell').eq('status', 'published').order('created_at', { ascending: false })
    if (error) fail(error)
    return (data ?? []).map(({ community_memberships, ...cell }: any) => ({ ...cell, member_count: community_memberships?.[0]?.count ?? 0 })) as Initiative<'cell'>[]
  }, () => SAMPLE_CELLS)
}

export function fetchInitiative(id: string) {
  if (!isUuid(id)) return Promise.resolve(import.meta.env.DEV ? SAMPLE_CELLS.find(cell => cell.id === id) ?? null : null)
  return devFallback(async () => {
    const { data, error } = await supabase.from('initiatives').select(`${INITIATIVE}, community_memberships(count)`).eq('id', id).maybeSingle()
    if (error) fail(error)
    if (!data) return null
    const { community_memberships, ...rest } = data as any
    return { ...rest, member_count: community_memberships?.[0]?.count ?? 0 } as Initiative
  }, () => null)
}

/** Upcoming published events and bootcamps, soonest first. */
export async function fetchUpcoming(): Promise<Initiative<'event' | 'bootcamp'>[]> {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const { data, error } = await supabase.from('initiatives').select(INITIATIVE).in('kind', ['event', 'bootcamp']).eq('status', 'published').gte('starts_at', today).order('starts_at')
  if (error) {
    if (['PGRST205', '42P01', '42703'].includes(error.code ?? '')) return []
    throw new Error(error.message)
  }
  return (data ?? []) as Initiative<'event' | 'bootcamp'>[]
}

export async function createInitiative(input: Pick<Initiative, 'kind' | 'title' | 'description' | 'city' | 'starts_at' | 'media_url' | 'media_type' | 'details'> & { owner_id: string }) {
  const { data, error } = await supabase.from('initiatives').insert({ ...input, status: 'published' }).select(INITIATIVE).single()
  if (error) fail(error)
  return data as Initiative
}

/* ── Media ── */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export async function uploadMedia(userId: string, file: File) {
  const kind = file.type.startsWith('video/') ? 'video' : 'image'
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (kind === 'video' ? 'mp4' : 'jpg')
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false })
  if (error) {
    if (/bucket not found/i.test(error.message)) throw new CommunityNotReady()
    throw new Error(error.message)
  }
  return { url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl, type: kind as 'image' | 'video' }
}

/* ── Cell membership and chat ── */

export type ChatAuthor = { id: string; full_name: string; avatar_url: string | null }
export type ChatMessage = { id: string; cell_id: string; author_id: string; body: string; created_at: string; author?: ChatAuthor | null; pending?: boolean }

export async function isMember(cellId: string, userId: string) {
  const { data, error } = await supabase.from('community_memberships').select('role').eq('cell_id', cellId).eq('user_id', userId).maybeSingle()
  if (error) fail(error)
  return data ? (data.role as string) : null
}

export async function joinCell(cellId: string, userId: string) {
  const { error } = await supabase.from('community_memberships').insert({ cell_id: cellId, user_id: userId, role: 'member' })
  if (error && error.code !== '23505') fail(error)
}

export async function leaveCell(cellId: string, userId: string) {
  const { error } = await supabase.from('community_memberships').delete().eq('cell_id', cellId).eq('user_id', userId)
  if (error) fail(error)
}

export async function fetchMembers(cellId: string) {
  const { data, error } = await supabase.from('community_memberships').select('role, user:profiles(id, full_name, avatar_url)').eq('cell_id', cellId).limit(60)
  if (error) fail(error)
  return (data ?? []).map((row: any) => ({ role: row.role as string, ...(row.user as ChatAuthor) })).filter(member => member.id)
}

const MESSAGE = 'id, cell_id, author_id, body, created_at, author:profiles(id, full_name, avatar_url)'

export async function fetchMessages(cellId: string, limit = 80) {
  const { data, error } = await supabase.from('cell_messages').select(MESSAGE).eq('cell_id', cellId).order('created_at', { ascending: false }).limit(limit)
  if (error) fail(error)
  return ((data ?? []) as unknown as ChatMessage[]).reverse()
}

export async function sendMessage(cellId: string, body: string) {
  const { data, error } = await supabase.from('cell_messages').insert({ cell_id: cellId, body }).select(MESSAGE).single()
  if (error) fail(error)
  return data as unknown as ChatMessage
}

/** Calls onMessage for every new message in the cell, from anyone. */
export function subscribeToCell(cellId: string, onMessage: (message: ChatMessage) => void): RealtimeChannel {
  return supabase
    .channel(`cell:${cellId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cell_messages', filter: `cell_id=eq.${cellId}` }, payload => onMessage(payload.new as ChatMessage))
    .subscribe()
}

/* ── Prayer walls ── */

export type PrayerWall = { id: string; host_id: string; code: string; title: string; purpose: string; starts_at: string; ends_at: string; created_at: string; host?: ChatAuthor | null }

const WALL = 'id, host_id, code, title, purpose, starts_at, ends_at, created_at, host:profiles(id, full_name, avatar_url)'

/** A Meet-style code: abc-defg-hij. */
export function newWallCode() {
  const letters = 'abcdefghijkmnopqrstuvwxyz'
  const pick = (count: number) => Array.from(crypto.getRandomValues(new Uint32Array(count)), value => letters[value % letters.length]).join('')
  return `${pick(3)}-${pick(4)}-${pick(3)}`
}

/** Accepts a bare code, a code without dashes, or a full invite link. */
export function normaliseWallCode(input: string) {
  const match = input.trim().toLowerCase().match(/([a-z]{3})-?([a-z]{4})-?([a-z]{3})\s*$/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

export async function createPrayerWall(input: { title: string; purpose: string; starts_at: string; ends_at: string }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.from('prayer_walls').insert({ ...input, code: newWallCode() }).select(WALL).single()
    if (!error) return data as unknown as PrayerWall
    if (error.code !== '23505') fail(error)
  }
  throw new Error('We couldn’t create a prayer wall. Try again.')
}

export async function fetchPrayerWall(code: string) {
  const { data, error } = await supabase.from('prayer_walls').select(WALL).eq('code', code).maybeSingle()
  if (error) fail(error)
  return data as unknown as PrayerWall | null
}

/** Walls that are live now or start within the next fortnight. */
export async function fetchPrayerWalls() {
  const now = new Date()
  const soon = new Date(now.getTime() + 14 * 86_400_000)
  const { data, error } = await supabase.from('prayer_walls').select(WALL).gt('ends_at', now.toISOString()).lt('starts_at', soon.toISOString()).order('starts_at').limit(40)
  if (error) fail(error)
  return (data ?? []) as unknown as PrayerWall[]
}

export function wallStatus(wall: Pick<PrayerWall, 'starts_at' | 'ends_at'>, now = Date.now()) {
  const start = new Date(wall.starts_at).getTime()
  const end = new Date(wall.ends_at).getTime()
  if (now >= end) return 'ended' as const
  if (now >= start) return 'live' as const
  return start - now <= 10 * 60_000 ? 'opening' as const : 'scheduled' as const
}

/* ── formatting ── */

export function formatDay(iso: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return new Intl.DateTimeFormat('en', options).format(date)
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

/** "18:30" → "6:30 PM"; already formatted values pass through. */
export function formatTime(value?: string) {
  if (!value) return ''
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return value
  const hours = Number(match[1])
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? 'AM' : 'PM'}`
}

export function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
}
