import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Pen } from '../../components/ui/icons'
import PostCard, { AuthorAvatar, KIND_META, PostCardSkeleton } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { fetchAuthorPosts, fetchPublicProfile, POST_KINDS, type Post, type PostKind, type PublicProfile } from '../../lib/posts'

export default function PublicProfilePage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<PostKind | 'all'>('all')

  useEffect(() => {
    let live = true
    setState('loading'); setPosts(null); setFilter('all')
    fetchPublicProfile(id)
      .then(found => { if (live) { setProfile(found); setState(found ? 'ready' : 'missing') } })
      .catch(caught => { if (live) { setError(caught instanceof Error ? caught.message : 'We couldn’t load this profile.'); setState('error') } })
    fetchAuthorPosts(id, { limit: 60 }).then(list => live && setPosts(list)).catch(() => live && setPosts([]))
    return () => { live = false }
  }, [id])

  const counts = useMemo(() => {
    const tally = { word: 0, study: 0, question: 0, opportunity: 0 } as Record<PostKind, number>
    posts?.forEach(post => { tally[post.kind] += 1 })
    return tally
  }, [posts])

  if (state === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading profile">
        <span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-surface"><img src="/assets/revival-flame-mark.png" alt="" className="h-7 w-7 object-contain" /></span>
      </div>
    )
  }

  if (state !== 'ready' || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-semibold">{state === 'missing' ? 'We couldn’t find this member' : 'Something went wrong'}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{state === 'missing' ? 'The profile may have been removed.' : error}</p>
        <Link to="/home" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Back to the feed</Link>
      </div>
    )
  }

  const name = profile.full_name || 'Revival One member'
  const location = [profile.city, profile.country].filter(Boolean).join(', ')
  const joined = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at))
  const mine = user?.id === profile.id
  const shown = (posts ?? []).filter(post => filter === 'all' || post.kind === filter)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="theme-dark relative overflow-hidden rounded-[28px] border border-white/10">
        <div className="absolute inset-0 hero-field-fallback--vivid" />
        <div className="absolute inset-0 hero-field-scrim--vivid" />
        <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-end sm:p-9">
          <span className="brand-ring brand-ring--on h-28 w-28 shrink-0 rounded-full">
            <AuthorAvatar author={profile} size="h-28 w-28" text="text-3xl" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Member since {joined}</p>
            <h1 className="mt-2 truncate font-heading text-4xl font-semibold tracking-[-0.02em] text-white">{name}</h1>
            {location && <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" /> {location}</p>}
            {(profile.ministry_focus || profile.church) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[profile.ministry_focus, profile.church].filter(Boolean).map(tag => <span key={tag} className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">{tag}</span>)}
              </div>
            )}
          </div>
          {mine && <Link to="/profile" className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-black/35 px-5 text-[13px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/50 sm:self-end"><Pen className="h-4 w-4" /> Edit profile</Link>}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-[24px] border border-white/[0.07] bg-surface-raised p-6">
            <h2 className="font-heading text-lg font-semibold">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{profile.bio || `${name.split(/\s+/)[0]} hasn’t written a bio yet.`}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {POST_KINDS.map(kind => {
              const meta = KIND_META[kind]
              return (
                <div key={kind} className="rounded-[20px] border border-white/[0.07] bg-surface p-4">
                  <meta.icon className="h-5 w-5" style={{ color: meta.accent }} />
                  <p className="mt-3 font-heading text-2xl font-semibold">{posts ? counts[kind] : '–'}</p>
                  <p className="text-[11px] text-muted-foreground">{meta.plural}</p>
                </div>
              )
            })}
          </div>
        </aside>

        <section aria-label={`Posts by ${name}`}>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter posts">
            {(['all', ...POST_KINDS] as const).map(option => {
              const active = option === filter
              return (
                <button key={option} type="button" role="tab" aria-selected={active} onClick={() => setFilter(option)} className={`inline-flex h-9 items-center rounded-full border px-4 text-[13px] font-medium transition-colors ${active ? 'border-primary/40 bg-primary/[0.12] text-foreground' : 'border-white/[0.08] bg-surface text-muted-foreground hover:text-foreground'}`}>
                  {option === 'all' ? `All posts${posts ? ` · ${posts.length}` : ''}` : KIND_META[option].plural}
                </button>
              )
            })}
          </div>
          <div className="mt-4 space-y-4">
            {posts === null ? <><PostCardSkeleton /><PostCardSkeleton /></> : shown.length ? shown.map(post => <PostCard key={post.id} post={post} />) : (
              <p className="rounded-[24px] border border-dashed border-white/[0.1] px-5 py-12 text-center text-sm text-muted-foreground">
                {mine ? 'You haven’t posted here yet. Share something from the Home feed.' : 'Nothing posted here yet.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
