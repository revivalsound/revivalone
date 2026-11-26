import { supabase } from './supabase'
import { shrinkImage } from './images'

export type MemberProfile = {
  id: string; full_name: string; avatar_url: string | null; cover_url: string | null
  city: string; country: string; church: string; ministry_focus: string; bio: string; website: string; created_at: string
}

const BASE = 'id, full_name, avatar_url, city, country, church, ministry_focus, bio, created_at'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Cover photos and websites arrive with supabase/profile-v2.sql; work without them until then. */
let extras: Promise<boolean> | null = null
export function profileExtras() {
  extras ??= Promise.resolve(supabase.from('profiles').select('cover_url, website').limit(1)).then(({ error }) => error?.code !== '42703')
  return extras
}

export async function fetchMemberProfile(id: string): Promise<MemberProfile | null> {
  if (!UUID.test(id)) return null
  const rich = await profileExtras()
  const { data, error } = await supabase.from('profiles').select(rich ? `${BASE}, cover_url, website` : BASE).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return { cover_url: null, website: '', ...(data as unknown as Partial<MemberProfile>) } as MemberProfile
}

export type ProfileStats = { posts: number; cells: number; walls: number }

export async function fetchProfileStats(id: string): Promise<ProfileStats> {
  const count = async (table: string, column: string) => {
    const { count: value, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, id)
    return error ? 0 : value ?? 0
  }
  const [posts, cells, walls] = await Promise.all([count('posts', 'author_id'), count('community_memberships', 'user_id'), count('prayer_walls', 'host_id')])
  return { posts, cells, walls }
}

export type MemberCell = { id: string; title: string; city: string; role: string; media_url: string; details: { focus?: string; focuses?: string[] } }

export async function fetchMemberCells(id: string): Promise<MemberCell[]> {
  const { data, error } = await supabase.from('community_memberships').select('role, cell:initiatives(id, title, city, media_url, details)').eq('user_id', id).limit(30)
  if (error) return []
  return (data ?? []).map((row: any) => row.cell && ({ ...row.cell, role: row.role })).filter(Boolean)
}

export type ProfileUpdate = Partial<Pick<MemberProfile, 'full_name' | 'city' | 'country' | 'church' | 'ministry_focus' | 'bio' | 'website' | 'avatar_url' | 'cover_url'>>

export async function updateMyProfile(userId: string, patch: ProfileUpdate) {
  const rich = await profileExtras()
  const row: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() }
  if (!rich) { delete row.cover_url; delete row.website }
  const { error } = await supabase.from('profiles').update(row).eq('id', userId)
  if (error) throw new Error(error.message)
  // Keep the session's copy of the name and photo in step.
  const meta: Record<string, unknown> = {}
  if (patch.full_name !== undefined) meta.full_name = patch.full_name
  if (patch.avatar_url !== undefined) meta.avatar_url = patch.avatar_url
  if (patch.city !== undefined) meta.city = patch.city
  if (Object.keys(meta).length) await supabase.auth.updateUser({ data: meta })
}

/** Uploads an avatar (square) or cover (wide) photo to the member's folder. */
export async function uploadProfilePhoto(userId: string, picked: File, kind: 'avatar' | 'cover') {
  if (!picked.type.startsWith('image/')) throw new Error('Choose a photo (JPG, PNG or WebP).')
  const file = await shrinkImage(picked, kind === 'avatar' ? { maxSize: 640, square: true } : { maxSize: 1800, quality: 0.84 })
  const path = `${userId}/${kind}-${Date.now()}.${file.type === 'image/webp' ? 'webp' : 'jpg'}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
