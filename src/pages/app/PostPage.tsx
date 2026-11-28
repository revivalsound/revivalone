import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bible, Clock, ExternalLink, Loader, MapPin, Trash } from '../../components/ui/icons'
import { Deck, Notice } from '../../components/ui/kit'
import PostCard, { AuthorAvatar, KIND_META, KindChip, PostCardSkeleton } from '../../components/posts/PostCard'
import PostActions from '../../components/posts/PostActions'
import PostComments from '../../components/posts/PostComments'
import MediaFrame from '../../components/posts/MediaFrame'
import MediaViewer from '../../components/posts/MediaViewer'
import { useAuth } from '../../lib/AuthContext'
import FollowButton from '../../components/social/FollowButton'
import { sanitizePostHtml } from '../../lib/richText'
import { deletePost, fetchAuthorPosts, fetchPost, fetchSimilar, readingMinutes, type Post, type PostMedia } from '../../lib/posts'

export default function PostPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [error, setError] = useState('')
  const [fromAuthor, setFromAuthor] = useState<Post[] | null>(null)
  const [similar, setSimilar] = useState<Post[] | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let live = true
    setState('loading'); setFromAuthor(null); setSimilar(null); setConfirming(false)
    fetchPost(id)
      .then(found => {
        if (!live) return
        setPost(found)
        setState(found ? 'ready' : 'missing')
        if (!found) return
        // Suggestions load after the post so reading starts straight away.
        fetchAuthorPosts(found.author_id, { exclude: found.id, limit: 3 }).then(list => live && setFromAuthor(list)).catch(() => live && setFromAuthor([]))
        fetchSimilar(found).then(list => live && setSimilar(list)).catch(() => live && setSimilar([]))
      })
      .catch(caught => { if (live) { setError(caught instanceof Error ? caught.message : 'We couldn’t load this post.'); setState('error') } })
    return () => { live = false }
  }, [id])

  async function remove() {
    if (!post) return
    setDeleting(true)
    try {
      await deletePost(post.id)
      navigate('/home', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t delete this post.')
      setDeleting(false)
    }
  }

  if (state === 'loading') {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><PostCardSkeleton /></div>
  }

  if (state !== 'ready' || !post) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-semibold">{state === 'missing' ? 'This post isn’t here' : 'Something went wrong'}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{state === 'missing' ? 'It may have been removed by the writer.' : error}</p>
        <Link to="/home" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Back to the feed</Link>
      </div>
    )
  }

  const meta = KIND_META[post.kind]
  const name = post.author?.full_name || 'A Revival Sound Tent member'
  const firstName = name.split(/\s+/)[0]
  const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(post.created_at))
  const mine = user?.id === post.author_id
  const paragraphs = post.body.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/home" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Feed</Link>

      <article className="mx-auto mt-6 max-w-3xl">
        {/* Title panel, tinted with the post's accent */}
        <header className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-surface p-7 sm:p-10" style={{ backgroundImage: `radial-gradient(110% 80% at 100% 0%, ${meta.accent}26, transparent 60%), radial-gradient(80% 60% at 0% 100%, rgba(255,92,138,0.08), transparent 60%)` }}>
          <KindChip kind={post.kind} type={post.opportunity_type} />
          <h1 className="mt-5 font-heading text-[2.1rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[3rem]">{post.title}</h1>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link to={`/u/${post.author_id}`} className="flex items-center gap-3 transition-opacity hover:opacity-85">
              <span className="brand-ring brand-ring--on rounded-full"><AuthorAvatar author={post.author} size="h-11 w-11" /></span>
              <span>
                <span className="block text-sm font-semibold">{name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">{post.author?.city && <><MapPin className="h-3 w-3" /> {post.author.city} · </>}{date}</span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {readingMinutes(post.body)} min read</span>
          </div>
        </header>

        <div className="px-1 sm:px-4">
          {post.scripture && (
            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-4 py-2 text-sm font-medium text-primary"><Bible className="h-4 w-4" /> {post.scripture}</p>
          )}
          {post.media && post.media.length > 0 && <Gallery media={post.media} />}
          {post.body_html
            ? (
              <div
                className="rich-text mt-8"
                dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.body_html) }}
                // Tagged people and Bible references open inside the app.
                onClick={event => {
                  const link = (event.target as HTMLElement).closest('a.mention') as HTMLAnchorElement | null
                  const href = link?.getAttribute('href')
                  if (link && href?.startsWith('/')) { event.preventDefault(); navigate(href) }
                }}
              />
            )
            : (
              <div className="post-body mt-8 text-[17px] leading-8 text-foreground/90">
                {paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
              </div>
            )}

          {post.link_url && (
            <a href={post.link_url} target="_blank" rel="noopener noreferrer nofollow" className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#ffd479] px-6 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a1206] transition-transform hover:-translate-y-0.5">
              Apply or learn more <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {post.tags.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{post.tags.map(tag => <span key={tag} className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-muted-foreground">#{tag}</span>)}</div>}

          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-6">
            <PostActions postId={post.id} title={post.title} />
            {mine && (confirming ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground">Delete this post for good?</span>
                <button type="button" onClick={remove} disabled={deleting} className="inline-flex h-10 items-center gap-2 rounded-full bg-red-500/90 px-4 text-[13px] font-semibold text-white disabled:opacity-60">{deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />} Delete</button>
                <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className="h-10 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground">Cancel</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-red-300 transition-colors hover:bg-red-500/10"><Trash className="h-4 w-4" /> Delete</button>
            ))}
          </div>
          {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
          <PostComments key={post.id} postId={post.id} />

          {/* About the writer */}
          <Link to={`/u/${post.author_id}`} className="bolt-card bolt-card--hover mt-8 flex items-center gap-4 rounded-[24px] border border-white/[0.07] bg-surface-raised p-5 transition-colors hover:bg-surface">
            <AuthorAvatar author={post.author} size="h-14 w-14" text="text-sm" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Written by</span>
              <span className="mt-0.5 block truncate font-heading text-lg font-semibold">{name}</span>
              {post.author?.church && <span className="block truncate text-xs text-muted-foreground">{post.author.church}</span>}
            </span>
            <span className="hidden items-center gap-1 text-[13px] font-semibold text-primary sm:inline-flex">View profile <ArrowRight className="h-4 w-4" /></span>
          </Link>
          {!mine && <div className="mt-3 flex justify-end"><FollowButton userId={post.author_id} /></div>}
        </div>
      </article>

      <Suggestions title={`More from ${firstName}`} posts={fromAuthor} link={{ to: `/u/${post.author_id}`, label: 'All posts' }} empty={`${firstName} hasn’t shared anything else yet.`} />
      <Suggestions title="Similar reads" lede="From other writers on the same theme." posts={similar} empty="No similar posts from other writers yet." />
    </div>
  )
}

function Suggestions({ title, lede, posts, link, empty }: { title: string; lede?: string; posts: Post[] | null; link?: { to: string; label: string }; empty: string }) {
  return (
    <section className="mx-auto mt-14 max-w-6xl" aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold">{title}</h2>
          {lede && <p className="mt-1 text-sm text-muted-foreground">{lede}</p>}
        </div>
        {link && posts && posts.length > 0 && <Link to={link.to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80">{link.label} <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {posts === null ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3"><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></div>
      ) : posts.length ? (
        <Deck key={posts.map(post => post.id).join()} className="mt-5 grid gap-4 md:grid-cols-3">
          {posts.map(post => <PostCard key={post.id} post={post} compact />)}
        </Deck>
      ) : (
        <p className="mt-5 rounded-[22px] border border-dashed border-white/[0.1] px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}

/** A post's photos and videos. Photos open full screen. */
function Gallery({ media }: { media: PostMedia[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <div className={`mt-8 grid items-start gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {media.map((item, index) => (
          <div key={item.url} className={`overflow-hidden rounded-[22px] border border-white/[0.07] bg-black ${media.length === 1 ? '' : media.length % 2 === 1 && index === 0 ? 'col-span-2' : ''}`}>
            {item.type === 'image'
              ? <button type="button" aria-label={`Preview attachment ${index + 1}`} onClick={() => setOpen(index)} className="block w-full"><MediaFrame item={item} alt={`Photo ${index + 1}`} /></button>
              : <div><MediaFrame item={item} controls /><button type="button" onClick={() => setOpen(index)} className="h-10 w-full bg-surface text-xs font-medium">Open preview</button></div>}
          </div>
        ))}
      </div>
      {open !== null && <MediaViewer media={media} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  )
}
