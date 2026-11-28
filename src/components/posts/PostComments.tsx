import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Chat, Loader, Trash } from '../ui/icons'
import { Notice, inputClass } from '../ui/kit'
import { AuthorAvatar } from './PostCard'
import { useAuth } from '../../lib/AuthContext'
import { timeAgo } from '../../lib/posts'
import { addComment, COMMENT_PAGE, fetchComments, removeComment, type PostComment } from '../../lib/postEngagement'

export default function PostComments({ postId }: { postId: string }) {
  const { user } = useAuth()
  const { hash } = useLocation()
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [more, setMore] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (hash !== '#comments') return
    const frame = requestAnimationFrame(() => document.getElementById('comments')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [hash, postId])
  useEffect(() => {
    let live = true
    setLoading(true); setError('')
    fetchComments(postId, page).then(list => {
      if (!live) return
      setComments(current => page === 0 ? list : [...current, ...list.filter(item => !current.some(existing => existing.id === item.id))])
      setMore(list.length === COMMENT_PAGE)
    }).catch(caught => { if (live) setError(caught instanceof Error ? caught.message : 'Couldn’t load comments.') }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [postId, page, retry])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !body.trim()) return
    setBusy(true); setError('')
    try { const comment = await addComment(postId, body); setComments(current => [comment, ...current]); setBody('') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Couldn’t add your comment. Your text is still here.') }
    finally { setBusy(false) }
  }
  async function remove(id: string) {
    setDeleting(id); setError('')
    try { await removeComment(id, postId); setComments(current => current.filter(item => item.id !== id)); setConfirming(null) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Couldn’t delete your comment.') }
    finally { setDeleting(null) }
  }
  return <section id="comments" tabIndex={-1} aria-labelledby="comments-title" className="mt-10 scroll-mt-24 border-t border-white/[0.08] pt-7">
    <h2 id="comments-title" className="flex items-center gap-2 font-heading text-xl font-semibold"><Chat className="h-5 w-5 text-primary" /> Conversation</h2>
    {user ? <form onSubmit={submit} className="mt-5">
      <label htmlFor="post-comment" className="mb-2 block text-sm font-medium">Add your voice</label>
      <textarea id="post-comment" required maxLength={3000} rows={3} value={body} disabled={busy} onChange={event => setBody(event.target.value)} placeholder="Share a thoughtful response…" className={`${inputClass} min-h-24 w-full resize-y rounded-2xl py-3 text-base`} />
      <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs tabular-nums text-muted-foreground">{body.length.toLocaleString()} / 3,000</span><button type="submit" disabled={busy || !body.trim()} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground disabled:opacity-40">{busy && <Loader className="h-4 w-4 animate-spin" />} Post comment</button></div>
    </form> : <p className="mt-4 text-sm text-muted-foreground"><Link className="text-primary underline" to={`/auth?next=${encodeURIComponent(`/post/${postId}#comments`)}`}>Sign in</Link> to join the conversation.</p>}
    {error && <div className="mt-4"><Notice tone="error">{error} <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>Try again</button></Notice></div>}
    <div className="mt-6 space-y-5">{comments.map(comment => <article key={comment.id} className="flex gap-3">
      <Link to={`/u/${comment.author_id}`} aria-label={`View ${comment.author?.full_name || 'member'} profile`}><AuthorAvatar author={comment.author} size="h-9 w-9" /></Link>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link to={`/u/${comment.author_id}`} className="text-sm font-semibold">{comment.author?.full_name || 'A member'}</Link><time className="text-xs text-muted-foreground" dateTime={comment.created_at}>{timeAgo(comment.created_at)}</time>
        {user?.id === comment.author_id && <button type="button" aria-label="Delete comment" disabled={Boolean(deleting)} onClick={() => setConfirming(comment.id)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-300"><Trash className="h-3.5 w-3.5" /></button>}</div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">{comment.body}</p>
        {confirming === comment.id && <div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><span>Delete this comment?</span><button type="button" disabled={Boolean(deleting)} onClick={() => void remove(comment.id)} className="py-2 font-semibold text-red-300">{deleting === comment.id ? 'Deleting…' : 'Delete'}</button><button type="button" onClick={() => setConfirming(null)} className="py-2 text-muted-foreground">Cancel</button></div>}
      </div>
    </article>)}</div>
    {loading && <p role="status" className="mt-5 text-sm text-muted-foreground">Loading comments…</p>}
    {!loading && !error && comments.length === 0 && <p className="mt-5 text-sm text-muted-foreground">No comments yet. Start the conversation.</p>}
    {!loading && more && <button type="button" onClick={() => setPage(value => value + 1)} className="mt-5 h-11 rounded-full border border-white/10 px-5 text-sm font-medium">Load more comments</button>}
  </section>
}
