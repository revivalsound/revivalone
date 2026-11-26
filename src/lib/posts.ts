import { supabase } from './supabase'

export const POST_KINDS = ['word', 'study', 'question', 'opportunity'] as const
export type PostKind = typeof POST_KINDS[number]

export const OPPORTUNITY_TYPES = ['job', 'business', 'investment', 'ministry', 'volunteer', 'other'] as const
export type OpportunityType = typeof OPPORTUNITY_TYPES[number]

export type Author = { id: string; full_name: string; avatar_url: string | null; city: string; church?: string }

export type Post = {
  id: string
  author_id: string
  kind: PostKind
  opportunity_type: OpportunityType | null
  title: string
  body: string
  scripture: string
  link_url: string
  tags: string[]
  created_at: string
  author: Author | null
}

export type PublicProfile = {
  id: string; full_name: string; avatar_url: string | null; city: string; country: string
  church: string; ministry_focus: string; bio: string; created_at: string
}

export type NewPost = Pick<Post, 'kind' | 'title' | 'body' | 'scripture' | 'link_url' | 'tags'> & { opportunity_type: OpportunityType | null }

const SELECT = 'id, author_id, kind, opportunity_type, title, body, scripture, link_url, tags, created_at, author:profiles(id, full_name, avatar_url, city, church)'

/** Thrown when supabase/posts.sql hasn't been run yet, so screens can say so plainly. */
export class FeedNotReady extends Error {
  constructor() { super('The feed isn’t switched on yet. Run supabase/posts.sql in Supabase to turn it on.') }
}

function fail(error: { code?: string; message: string }): never {
  if (error.code === 'PGRST205' || error.code === '42P01') throw new FeedNotReady()
  throw new Error(error.message)
}

export const PAGE_SIZE = 12

export async function fetchFeed(kind: PostKind | 'all', page = 0) {
  let query = supabase.from('posts').select(SELECT).order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
  if (kind !== 'all') query = query.eq('kind', kind)
  const { data, error } = await query
  if (error) fail(error)
  return (data ?? []) as unknown as Post[]
}

export async function fetchPost(id: string) {
  if (!UUID.test(id)) return null
  const { data, error } = await supabase.from('posts').select(SELECT).eq('id', id).maybeSingle()
  if (error) fail(error)
  return data as unknown as Post | null
}

export async function fetchAuthorPosts(authorId: string, { exclude, limit = 24 }: { exclude?: string; limit?: number } = {}) {
  let query = supabase.from('posts').select(SELECT).eq('author_id', authorId).order('created_at', { ascending: false }).limit(limit)
  if (exclude) query = query.neq('id', exclude)
  const { data, error } = await query
  if (error) fail(error)
  return (data ?? []) as unknown as Post[]
}

/** Posts by other writers on the same theme: shared tags first, then the same kind. */
export async function fetchSimilar(post: Post, limit = 3) {
  const rank = (candidates: Post[]) => {
    const seen = new Set<string>()
    return candidates
      .filter(candidate => candidate.author_id !== post.author_id && candidate.id !== post.id && !seen.has(candidate.id) && seen.add(candidate.id))
      .map(candidate => ({ candidate, score: candidate.tags.filter(tag => post.tags.includes(tag)).length * 2 + (candidate.kind === post.kind ? 1 : 0) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.candidate.created_at.localeCompare(a.candidate.created_at))
      .slice(0, limit)
      .map(({ candidate }) => candidate)
  }
  const others = () => supabase.from('posts').select(SELECT).neq('author_id', post.author_id).order('created_at', { ascending: false }).limit(12)
  const [byTag, byKind] = await Promise.all([
    post.tags.length ? others().overlaps('tags', post.tags) : Promise.resolve({ data: [], error: null }),
    others().eq('kind', post.kind),
  ])
  if (byTag.error) fail(byTag.error)
  if (byKind.error) fail(byKind.error)
  return rank([...(byTag.data ?? []), ...(byKind.data ?? [])] as unknown as Post[])
}

export async function createPost(input: NewPost) {
  const { data, error } = await supabase.from('posts').insert(input).select(SELECT).single()
  if (error) fail(error)
  return data as unknown as Post
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) fail(error)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function fetchPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!UUID.test(id)) return null
  const { data, error } = await supabase.from('profiles')
    .select('id, full_name, avatar_url, city, country, church, ministry_focus, bio, created_at')
    .eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as PublicProfile | null) ?? null
}

/* ── formatting ── */

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.trim().split(/\s+/).length / 200))
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const steps: [number, string][] = [[60, 'm'], [24, 'h'], [7, 'd']]
  let value = seconds / 60
  for (const [size, unit] of steps) {
    if (value < size) return `${Math.floor(value)}${unit} ago`
    value /= size
  }
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: new Date(iso).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).format(new Date(iso))
}

export function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'RO'
}

export function parseTags(value: string) {
  return [...new Set(value.split(',').map(tag => tag.trim().replace(/^#/, '').toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean))].slice(0, 5)
}
