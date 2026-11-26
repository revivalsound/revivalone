import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, PenNew } from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import PostCard, { KIND_META, PostCardSkeleton } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { ComingUpCard, PrayerWallsCard, TodaysReadingsCard, VerseOfTheDayCard } from '../../components/bible/TodayCards'
import { fetchFeed, FeedNotReady, PAGE_SIZE, POST_KINDS, type Post, type PostKind } from '../../lib/posts'

type Filter = PostKind | 'all'

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

/** True while the page is scrolling; false once it has rested for a moment. */
function useScrolling(restMs = 320) {
  const [scrolling, setScrolling] = useState(false)
  useEffect(() => {
    let timer = 0
    const onScroll = () => {
      setScrolling(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setScrolling(false), restMs)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); window.clearTimeout(timer) }
  }, [restMs])
  return scrolling
}

export default function Home() {
  const { user, displayName } = useAuth()
  const firstName = user ? displayName.trim().split(/\s+/)[0] : ''
  const [filter, setFilter] = useState<Filter>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notReady, setNotReady] = useState(false)
  const navigate = useNavigate()
  const compose = () => navigate('/create/post')
  const scrolling = useScrolling()
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (kind: Filter, nextPage: number) => {
    setLoading(true)
    setError('')
    try {
      const batch = await fetchFeed(kind, nextPage)
      setPosts(current => nextPage === 0 ? batch : [...current, ...batch.filter(post => !current.some(existing => existing.id === post.id))])
      setHasMore(batch.length === PAGE_SIZE)
      setPage(nextPage)
      setNotReady(false)
    } catch (caught) {
      setNotReady(caught instanceof FeedNotReady)
      setError(caught instanceof Error ? caught.message : 'We couldn’t load the feed.')
      if (nextPage === 0) setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(filter, 0) }, [filter, load])

  // Load the next page when the end of the feed comes into view.
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasMore || loading) return
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) void load(filter, page + 1) }, { rootMargin: '600px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [filter, hasMore, load, loading, page])



  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <header>
            <p className="mb-3 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {greeting()}</p>
            <h1 className="font-heading text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[2.6rem]">
              {firstName ? <>Welcome back, <span className="text-primary">{firstName}.</span></> : <>The <span className="text-primary">Revival One</span> feed.</>}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">Words, studies, questions and Kingdom opportunities from the community.</p>
          </header>

          {/* Composer prompt: the same flow as the floating button */}
          <button type="button" onClick={compose} className="bolt-card bolt-card--hover mt-6 flex w-full items-center gap-3 rounded-[22px] border border-white/[0.07] bg-surface p-3 pr-4 text-left transition-colors hover:bg-surface-raised">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><PenNew className="h-5 w-5" /></span>
            <span className="flex-1 text-sm text-muted-foreground">Share a word, a study, a question or an opportunity…</span>
            <span className="hidden h-9 items-center rounded-full bg-primary px-4 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground sm:inline-flex">Post</span>
          </button>

          <div className="sticky top-14 z-10 -mx-4 mt-6 overflow-x-auto bg-background/80 px-4 py-3 backdrop-blur-xl [scrollbar-width:none] sm:mx-0 sm:rounded-full sm:px-0" role="tablist" aria-label="Filter posts">
            <div className="flex w-max gap-1.5">
              {(['all', ...POST_KINDS] as Filter[]).map(option => {
                const active = option === filter
                const meta = option === 'all' ? null : KIND_META[option]
                return (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(option)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors ${active ? 'border-primary/40 bg-primary/[0.12] text-foreground' : 'border-white/[0.08] bg-surface text-muted-foreground hover:text-foreground'}`}
                  >
                    {meta && <meta.icon className="h-4 w-4" style={{ color: meta.accent }} />}
                    {meta ? meta.plural : 'All posts'}
                  </button>
                )
              })}
            </div>
          </div>

          <section aria-label="Posts" aria-busy={loading} className="mt-3 space-y-4">
            {error && (
              <Notice tone="error">
                {error}
                {!notReady && <button type="button" onClick={() => void load(filter, 0)} className="ml-2 font-semibold underline underline-offset-2">Try again</button>}
              </Notice>
            )}
            {posts.map(post => <PostCard key={post.id} post={post} />)}
            {loading && (posts.length ? <PostCardSkeleton /> : <><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></>)}
            {!loading && !error && posts.length === 0 && (
              <div className="rounded-[26px] border border-dashed border-white/[0.1] bg-surface/60 px-6 py-14 text-center">
                <span className="brand-ring brand-ring--on mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface"><img src="/assets/revival-flame-mark.png" alt="" className="h-7 w-7 object-contain" /></span>
                <h2 className="mt-5 font-heading text-xl font-semibold">{filter === 'all' ? 'Be the first to post' : `No ${KIND_META[filter].plural.toLowerCase()} yet`}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Share what God is saying, what you are studying, a question, or an opportunity for someone in the Kingdom.</p>
                <button type="button" onClick={compose} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Write a post <ArrowRight className="h-4 w-4" /></button>
              </div>
            )}
            <div ref={sentinel} aria-hidden />
            {!loading && !hasMore && posts.length > PAGE_SIZE && <p className="py-6 text-center text-xs text-muted-foreground">You’re all caught up.</p>}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <VerseOfTheDayCard />
          <TodaysReadingsCard />
          <PrayerWallsCard />
          <ComingUpCard />
        </aside>
      </div>

      {/* Floating Post button: hides while the feed scrolls, returns when it rests.
          Portalled to <body> so the page's entrance transform can't offset it. */}
      {createPortal(<button
        type="button"
        onClick={compose}
        data-hidden={scrolling}
        aria-hidden={scrolling}
        tabIndex={scrolling ? -1 : 0}
        className="post-fab group fixed bottom-24 right-5 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-primary pl-5 pr-6 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_16px_40px_rgba(255,92,138,0.42)] ring-1 ring-white/20 hover:bg-primary/95 active:scale-[0.97] lg:bottom-8 lg:right-8"
      >
        <PenNew className="h-5 w-5 transition-transform group-hover:-rotate-12" strokeWidth={2.2} /> Post
      </button>, document.body)}

    </div>
  )
}
