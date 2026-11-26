import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Chat, Check, Copy, Globe, MapPin, Pen, Play, Settings, Users } from '../../components/ui/icons'
import PostCard, { AuthorAvatar, KIND_META, PostCardSkeleton } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { fetchAuthorPosts, POST_KINDS, type Post, type PostKind } from '../../lib/posts'
import { fetchMemberCells, fetchMemberProfile, fetchProfileStats, type MemberCell, type MemberProfile, type ProfileStats } from '../../lib/profiles'

type Tab = 'posts' | 'media' | 'cells' | 'about'

/**
 * A member's profile: cover, photo, bio and stats, then their posts, media,
 * cells and details. /profile shows your own, with an Edit profile button.
 */
export default function ProfilePage({ self = false }: { self?: boolean }) {
  const params = useParams()
  const { user } = useAuth()
  const id = self ? user?.id ?? '' : params.id ?? ''
  const mine = Boolean(user && user.id === id)

  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [error, setError] = useState('')
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [cells, setCells] = useState<MemberCell[] | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [tab, setTab] = useState<Tab>('posts')
  const [filter, setFilter] = useState<PostKind | 'all'>('all')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    let live = true
    setState('loading'); setPosts(null); setCells(null); setStats(null); setTab('posts'); setFilter('all')
    fetchMemberProfile(id)
      .then(found => { if (live) { setProfile(found); setState(found ? 'ready' : 'missing') } })
      .catch(caught => { if (live) { setError(caught instanceof Error ? caught.message : 'We couldn’t load this profile.'); setState('error') } })
    fetchAuthorPosts(id, { limit: 60 }).then(list => live && setPosts(list)).catch(() => live && setPosts([]))
    fetchMemberCells(id).then(list => live && setCells(list))
    fetchProfileStats(id).then(value => live && setStats(value))
    return () => { live = false }
  }, [id])

  const media = useMemo(() => (posts ?? []).flatMap(post => (post.media ?? []).map(item => ({ ...item, post }))), [posts])
  const shownPosts = (posts ?? []).filter(post => filter === 'all' || post.kind === filter)

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6" aria-busy>
        <div className="h-44 animate-pulse rounded-[30px] bg-surface sm:h-60" />
        <div className="-mt-14 ml-6 h-28 w-28 animate-pulse rounded-full border-4 border-background bg-surface-raised" />
        <div className="mt-5 h-6 w-48 animate-pulse rounded-full bg-surface" />
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
  const firstName = name.split(/\s+/)[0]
  const location = [profile.city, profile.country].filter(Boolean).join(', ')
  const joined = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at))
  const focuses = profile.ministry_focus.split(/[,·]/).map(item => item.trim()).filter(Boolean)
  const website = profile.website ? profile.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : ''

  function share() {
    const url = `${window.location.origin}/u/${profile!.id}`
    const done = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    if (navigator.share) void navigator.share({ title: `${name} on Revival One`, url }).catch(() => undefined)
    else void navigator.clipboard.writeText(url).then(done)
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'posts', label: 'Posts', count: posts?.length },
    { id: 'media', label: 'Media', count: media.length },
    { id: 'cells', label: 'Cells', count: cells?.length },
    { id: 'about', label: 'About' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
      {/* Cover */}
      <div className="theme-dark relative h-44 overflow-hidden rounded-[30px] border border-white/10 sm:h-64">
        {profile.cover_url
          ? <img src={profile.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <><div className="absolute inset-0 hero-field-fallback--vivid" /><div className="absolute inset-0 hero-field-scrim--vivid" /><img src="/assets/revival-flame-mark.png" alt="" className="absolute -bottom-10 right-6 h-52 w-52 object-contain opacity-20 mix-blend-screen" /></>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {mine && (
          <Link to="/profile/edit" aria-label="Profile settings" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"><Settings className="h-4 w-4" /></Link>
        )}
      </div>

      {/* Identity */}
      <div className="relative px-1 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <span className="brand-ring brand-ring--on -mt-14 shrink-0 rounded-full sm:-mt-16">
            <span className="block rounded-full border-[5px] border-background">
              <AuthorAvatar author={profile} size="h-28 w-28 sm:h-32 sm:w-32" text="text-3xl" />
            </span>
          </span>
          <div className="flex items-center gap-2 pb-1">
            {mine ? (
              <Link to="/profile/edit" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_30px_rgba(255,92,138,0.28)] transition-transform hover:-translate-y-0.5"><Pen className="h-4 w-4" /> Edit profile</Link>
            ) : null}
            <button type="button" onClick={share} aria-label="Share profile" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-surface px-4 text-[13px] font-semibold transition-colors hover:bg-surface-raised">
              {copied ? <><Check className="h-4 w-4 text-primary" /> Copied</> : <><Copy className="h-4 w-4 text-primary" /> <span className="hidden sm:inline">Share</span></>}
            </button>
          </div>
        </div>

        <h1 className="mt-4 font-heading text-[1.9rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.3rem]">{name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          {location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {location}</span>}
          {profile.church && <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> {profile.church}</span>}
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> Joined {joined}</span>
        </p>

        {profile.bio
          ? <p className="mt-4 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-foreground/90">{profile.bio}</p>
          : mine && <Link to="/profile/edit" className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary/80">+ Add a bio so people know your story</Link>}

        {(focuses.length > 0 || website) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {focuses.map(item => <span key={item} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item}</span>)}
            {website && <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-3 py-1 text-xs font-semibold hover:border-primary/40"><Globe className="h-3.5 w-3.5 text-primary" /> {website}</a>}
          </div>
        )}

        {/* Stats */}
        <dl className="mt-6 grid grid-cols-3 divide-x divide-white/[0.08] rounded-[22px] border border-white/[0.07] bg-surface py-4 sm:max-w-md">
          {([['Posts', stats?.posts], ['Cells', stats?.cells], ['Prayer walls', stats?.walls]] as const).map(([label, value]) => (
            <div key={label} className="text-center">
              <dt className="sr-only">{label}</dt>
              <dd className="font-heading text-2xl font-semibold">{value ?? '–'}</dd>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </dl>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10 -mx-4 mt-8 border-b border-white/[0.07] bg-background/85 px-4 backdrop-blur-xl sm:mx-0 sm:px-0" role="tablist" aria-label="Profile sections">
        <div className="flex gap-1 overflow-x-auto sm:px-6">
          {tabs.map(item => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`relative h-12 shrink-0 px-4 text-[14px] font-semibold transition-colors ${tab === item.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {item.label}{item.count ? <span className="ml-1.5 text-xs text-muted-foreground">{item.count}</span> : null}
              {tab === item.id && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6 sm:px-6">
        {tab === 'posts' && (
          <>
            {(posts?.length ?? 0) > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(['all', ...POST_KINDS] as const).map(option => (
                  <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)} className={`h-9 rounded-full border px-4 text-[13px] font-medium transition-colors ${filter === option ? 'border-primary/40 bg-primary/[0.12] text-foreground' : 'border-white/[0.08] bg-surface text-muted-foreground hover:text-foreground'}`}>
                    {option === 'all' ? 'All' : KIND_META[option].plural}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-4">
              {posts === null ? <><PostCardSkeleton /><PostCardSkeleton /></> : shownPosts.length ? shownPosts.map(post => <PostCard key={post.id} post={post} />) : (
                <Empty icon={<Pen className="h-6 w-6" />} title={mine ? 'Share your first post' : `${firstName} hasn’t posted yet`} copy={mine ? 'A word, a study, a question or an opportunity for the community.' : 'Their words, studies and questions will appear here.'} action={mine ? { to: '/create/post', label: 'Write a post' } : undefined} />
              )}
            </div>
          </>
        )}

        {tab === 'media' && (
          media.length ? (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {media.map(item => (
                <Link key={item.url} to={`/post/${item.post.id}`} className="group relative aspect-square overflow-hidden rounded-[14px] bg-black sm:rounded-[18px]">
                  {item.type === 'image'
                    ? <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <video src={`${item.url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />}
                  {item.type === 'video' && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"><Play className="h-3.5 w-3.5" /></span>}
                </Link>
              ))}
            </div>
          ) : <Empty icon={<Play className="h-6 w-6" />} title="No photos or videos yet" copy={mine ? 'Photos and videos you add to posts appear here.' : `Photos and videos ${firstName} shares appear here.`} action={mine ? { to: '/create/post', label: 'Post a photo' } : undefined} />
        )}

        {tab === 'cells' && (
          cells === null ? <PostCardSkeleton /> : cells.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {cells.map(cell => (
                <Link key={cell.id} to={`/community/cells/${cell.id}`} className="bolt-card bolt-card--hover flex items-center gap-4 rounded-[22px] border border-white/[0.07] bg-surface p-4 transition-colors hover:bg-surface-raised">
                  {cell.media_url
                    ? <img src={cell.media_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                    : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-plum font-heading text-sm font-semibold text-primary">{cell.title.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate font-heading text-[15px] font-semibold">{cell.title}</b>
                    <small className="block truncate text-xs text-muted-foreground">{[cell.city, (cell.details.focuses ?? [cell.details.focus]).filter(Boolean)[0]].filter(Boolean).join(' · ')}</small>
                  </span>
                  {cell.role !== 'member' && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold capitalize text-primary">{cell.role}</span>}
                  <Chat className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : <Empty icon={<Users className="h-6 w-6" />} title={mine ? 'You haven’t joined a cell yet' : `${firstName} isn’t in a cell yet`} copy="Revival cells are small groups that pray, study and serve together." action={mine ? { to: '/community/cells', label: 'Find a cell' } : undefined} />
        )}

        {tab === 'about' && (
          <dl className="divide-y divide-white/[0.07] overflow-hidden rounded-[24px] border border-white/[0.07] bg-surface">
            {([
              ['Name', name],
              ['City', profile.city],
              ['Country', profile.country],
              ['Church or community', profile.church],
              ['Ministry focus', profile.ministry_focus],
              ['Website', website],
              ['Member since', joined],
            ] as const).filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                <dd className="text-[15px]">{label === 'Website' ? <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="text-primary">{value}</a> : value}</dd>
              </div>
            ))}
            {mine && (
              <Link to="/profile/edit" className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-primary hover:bg-white/[0.03]">Edit these details <ArrowRight className="h-4 w-4" /></Link>
            )}
          </dl>
        )}
      </section>
    </div>
  )
}

function Empty({ icon, title, copy, action }: { icon: ReactNode; title: string; copy: string; action?: { to: string; label: string } }) {
  return (
    <div className="rounded-[26px] border border-dashed border-white/[0.1] bg-surface/60 px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">{icon}</span>
      <h2 className="mt-5 font-heading text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{copy}</p>
      {action && <Link to={action.to} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">{action.label} <ArrowRight className="h-4 w-4" /></Link>}
    </div>
  )
}
