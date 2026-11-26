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

// In local dev, before the table exists, the screens fall back to sample posts so the
// design can be reviewed. The samples are never bundled into production.
async function samples(): Promise<Post[] | null> {
  if (!import.meta.env.DEV) return null
  const module = await import('./sample-posts')
  return module.SAMPLE_POSTS
}

async function withSamples<T>(load: () => Promise<T>, fallback: (posts: Post[]) => T): Promise<T> {
  try {
    return await load()
  } catch (error) {
    const posts = error instanceof FeedNotReady ? await samples() : null
    if (posts) return fallback(posts)
    throw error
  }
}

export const PAGE_SIZE = 12

export function fetchFeed(kind: PostKind | 'all', page = 0) {
  return withSamples(async () => {
    let query = supabase.from('posts').select(SELECT).order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (kind !== 'all') query = query.eq('kind', kind)
    const { data, error } = await query
    if (error) fail(error)
    return (data ?? []) as unknown as Post[]
  }, posts => page > 0 ? [] : posts.filter(post => kind === 'all' || post.kind === kind))
}

export function fetchPost(id: string) {
  if (!UUID.test(id)) return samples().then(posts => posts?.find(post => post.id === id) ?? null)
  return withSamples(async () => {
    const { data, error } = await supabase.from('posts').select(SELECT).eq('id', id).maybeSingle()
    if (error) fail(error)
    return data as unknown as Post | null
  }, posts => posts.find(post => post.id === id) ?? null)
}

export function fetchAuthorPosts(authorId: string, { exclude, limit = 24 }: { exclude?: string; limit?: number } = {}) {
  return withSamples(async () => {
    let query = supabase.from('posts').select(SELECT).eq('author_id', authorId).order('created_at', { ascending: false }).limit(limit)
    if (exclude) query = query.neq('id', exclude)
    const { data, error } = await query
    if (error) fail(error)
    return (data ?? []) as unknown as Post[]
  }, posts => posts.filter(post => post.author_id === authorId && post.id !== exclude).slice(0, limit))
}

/** Posts by other writers on the same theme: shared tags first, then the same kind. */
export function fetchSimilar(post: Post, limit = 3) {
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
  return withSamples(async () => {
    const others = () => supabase.from('posts').select(SELECT).neq('author_id', post.author_id).order('created_at', { ascending: false }).limit(12)
    const [byTag, byKind] = await Promise.all([
      post.tags.length ? others().overlaps('tags', post.tags) : Promise.resolve({ data: [], error: null }),
      others().eq('kind', post.kind),
    ])
    if (byTag.error) fail(byTag.error)
    if (byKind.error) fail(byKind.error)
    return rank([...(byTag.data ?? []), ...(byKind.data ?? [])] as unknown as Post[])
  }, rank)
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
  if (!UUID.test(id)) return sampleProfile(id)
  const { data, error } = await supabase.from('profiles')
    .select('id, full_name, avatar_url, city, country, church, ministry_focus, bio, created_at')
    .eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as PublicProfile | null) ?? sampleProfile(id)
}

// Sample authors exist only in local dev; anywhere else an unknown id is simply missing.
async function sampleProfile(id: string): Promise<PublicProfile | null> {
  const sample = (await samples())?.find(post => post.author_id === id)?.author
  return sample ? { country: '', church: sample.church ?? '', ministry_focus: '', bio: 'A sample writer for previewing the feed in local development.', created_at: '2026-01-01T00:00:00Z', ...sample } : null
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
