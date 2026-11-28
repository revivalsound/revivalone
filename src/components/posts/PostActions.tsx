import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chat, Check, Heart, Share } from '../ui/icons'
import { useAuth } from '../../lib/AuthContext'
import { fetchEngagement, setPostLiked, type Engagement } from '../../lib/postEngagement'

export default function PostActions({ postId, title }: { postId: string; title: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id
  const [stats, setStats] = useState<Engagement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true
    const refresh = () => fetchEngagement(postId).then(value => { if (live) { setStats(value); setError('') } }).catch(caught => { if (live) setError(caught instanceof Error ? caught.message : 'Couldn’t load reactions.') })
    setStats(null); void refresh()
    const changed = (event: Event) => { if ((event as CustomEvent<string>).detail === postId) void refresh() }
    window.addEventListener('post-engagement', changed)
    return () => { live = false; window.removeEventListener('post-engagement', changed) }
  }, [postId, userId, retry])
  useEffect(() => { if (!copied) return; const timeout = setTimeout(() => setCopied(false), 2200); return () => clearTimeout(timeout) }, [copied])

  async function like() {
    if (!user) { navigate(`/auth?next=${encodeURIComponent(`/post/${postId}`)}`); return }
    if (!stats || busy) return
    const previous = stats
    setBusy(true); setError('')
    setStats({ ...stats, liked: !stats.liked, likes: Math.max(0, stats.likes + (stats.liked ? -1 : 1)) })
    try { await setPostLiked(postId, user.id, !previous.liked) }
    catch (caught) { setStats(previous); setError(caught instanceof Error ? caught.message : 'Couldn’t save your like. Try again.') }
    finally { setBusy(false) }
  }
  async function share() {
    const url = new URL(`/post/${postId}`, window.location.origin).href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); setCopied(true) }
    } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError('Couldn’t share this post. Please try again.') }
  }
  const button = 'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors hover:bg-white/[0.06] active:scale-[0.98]'
  return <div className="relative z-[2] w-full">
    <div className="flex items-center justify-start gap-1" aria-label="Post actions">
      <button type="button" aria-label={stats?.liked ? 'Unlike post' : 'Like post'} aria-pressed={stats?.liked ?? false} disabled={busy || !stats} onClick={like} className={`${button} ${stats?.liked ? 'text-primary' : 'text-muted-foreground'} disabled:opacity-50`}><Heart className="h-[18px] w-[18px]" fill={stats?.liked ? 'currentColor' : 'none'} />{stats ? <span className="tabular-nums">{stats.likes}</span> : <span aria-hidden>—</span>}</button>
      <Link aria-label="Comment on post" to={`/post/${postId}#comments`} className={`${button} text-muted-foreground`}><Chat className="h-[18px] w-[18px]" /><span className="tabular-nums">{stats?.comments ?? '—'}</span></Link>
      <button type="button" aria-label="Share post" onClick={share} className={`${button} ${copied ? 'text-primary' : 'text-muted-foreground'}`}>{copied ? <Check className="h-[18px] w-[18px]" /> : <Share className="h-[18px] w-[18px]" />}<span>{copied ? 'Copied' : 'Share'}</span></button>
    </div>
    <span className="sr-only" role="status">{copied ? 'Post link copied' : ''}</span>
    {error && <p role="alert" className="mt-1 text-xs leading-5 text-red-300">{error} <button type="button" onClick={() => setRetry(value => value + 1)} className="underline underline-offset-2">Retry</button></p>}
  </div>
}
