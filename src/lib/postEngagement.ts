import { supabase } from './supabase'
import type { Author } from './posts'

export type Engagement = { likes: number; comments: number; liked: boolean }
export type PostComment = { id: string; post_id: string; author_id: string; body: string; created_at: string; author: Author | null }

function fail(error: { code?: string; message: string }): never {
  if (['PGRST202', 'PGRST205', '42P01'].includes(error.code ?? '')) throw new Error('Likes and comments are temporarily unavailable. Please try again shortly.')
  throw new Error(error.message)
}

// Cards mounted in the same render share a single request, rather than one per card.
type Pending = { id: string; resolve: (value: Engagement) => void; reject: (error: unknown) => void }
let pending: Pending[] = []
let timer: ReturnType<typeof setTimeout> | undefined
export function fetchEngagement(id: string): Promise<Engagement> {
  return new Promise((resolve, reject) => {
    pending.push({ id, resolve, reject })
    timer ??= setTimeout(() => {
      const batch = pending
      pending = []; timer = undefined
      void (async () => {
        try {
          const { data, error } = await supabase.rpc('post_engagement', { post_ids: [...new Set(batch.map(item => item.id))] })
          if (error) fail(error)
          for (const item of batch) {
            const row = data?.find((row: { post_id: string }) => row.post_id === item.id)
            item.resolve({ likes: Number(row?.likes ?? 0), comments: Number(row?.comments ?? 0), liked: Boolean(row?.liked) })
          }
        } catch (error) { batch.forEach(item => item.reject(error)) }
      })()
    }, 0)
  })
}

export async function setPostLiked(postId: string, userId: string, liked: boolean) {
  const result = liked
    ? await supabase.from('post_likes').upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true })
    : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (result.error) fail(result.error)
  engagementChanged(postId)
}

const COMMENT = 'id, post_id, author_id, body, created_at, author:profiles(id, full_name, avatar_url, city)'
export const COMMENT_PAGE = 20
export async function fetchComments(postId: string, page = 0) {
  const { data, error } = await supabase.from('post_comments').select(COMMENT).eq('post_id', postId).order('created_at', { ascending: false }).order('id').range(page * COMMENT_PAGE, (page + 1) * COMMENT_PAGE - 1)
  if (error) fail(error)
  return (data ?? []) as unknown as PostComment[]
}
export async function addComment(postId: string, body: string) {
  const text = body.trim()
  if (!text || text.length > 3000) throw new Error('Write a comment between 1 and 3,000 characters.')
  const { data, error } = await supabase.from('post_comments').insert({ post_id: postId, body: text }).select(COMMENT).single()
  if (error) fail(error)
  engagementChanged(postId)
  return data as unknown as PostComment
}
export async function removeComment(id: string, postId: string) {
  const { error } = await supabase.from('post_comments').delete().eq('id', id)
  if (error) fail(error)
  engagementChanged(postId)
}
function engagementChanged(postId: string) { window.dispatchEvent(new CustomEvent('post-engagement', { detail: postId })) }
