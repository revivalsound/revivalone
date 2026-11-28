import { useState, type CSSProperties, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import PhotoImg from '../ui/PhotoImg'
import PostActions from './PostActions'
import MediaFrame from './MediaFrame'
import MediaViewer from './MediaViewer'
import { excerptHtml } from '../../lib/richText'
import { ArrowRight, Bible, Briefcase, Clock, Play, GraphUp, HandHeart, HandMoney, HandStars, Notebook, Question, Sparkles } from '../ui/icons'
import { initialsOf, readingMinutes, timeAgo, type Author, type OpportunityType, type Post, type PostKind, type PostMedia } from '../../lib/posts'

type Meta = { label: string; plural: string; icon: ElementType; accent: string; copy: string }

export const KIND_META: Record<PostKind, Meta> = {
  word: { label: 'Word', plural: 'Words', icon: Bible, accent: '#ff5c8a', copy: 'Something God is speaking to you' },
  study: { label: 'Study', plural: 'Studies', icon: Notebook, accent: '#d7b8ff', copy: 'A Bible study or teaching' },
  question: { label: 'Question', plural: 'Questions', icon: Question, accent: '#ffb36b', copy: 'Ask the community for wisdom' },
  opportunity: { label: 'Opportunity', plural: 'Opportunities', icon: Briefcase, accent: '#ffd479', copy: 'A job, business or Kingdom opening' },
}

export const OPPORTUNITY_META: Record<OpportunityType, { label: string; icon: ElementType }> = {
  job: { label: 'Job', icon: Briefcase },
  business: { label: 'Business', icon: HandMoney },
  investment: { label: 'Investment', icon: GraphUp },
  ministry: { label: 'Ministry role', icon: HandHeart },
  volunteer: { label: 'Volunteer', icon: HandStars },
  other: { label: 'Opening', icon: Sparkles },
}

export function AuthorAvatar({ author, size = 'h-10 w-10', text = 'text-xs' }: { author: Pick<Author, 'full_name' | 'avatar_url'> | null; size?: string; text?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff5c8a] to-[#e11d5c] font-heading ${text} font-bold text-primary-foreground ring-2 ring-white/[0.08]`}>
      {author?.avatar_url ? <PhotoImg src={author.avatar_url} fallback={initialsOf(author.full_name ?? '')} lazy /> : initialsOf(author?.full_name ?? '')}
    </span>
  )
}

export function KindChip({ kind, type }: { kind: PostKind; type?: OpportunityType | null }) {
  const meta = KIND_META[kind]
  const opportunity = type ? OPPORTUNITY_META[type] : null
  const Icon = opportunity?.icon ?? meta.icon
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: meta.accent, borderColor: `${meta.accent}40`, background: `${meta.accent}14` }}>
      <Icon className="h-3.5 w-3.5" /> {opportunity ? `${opportunity.label} · ${meta.label}` : meta.label}
    </span>
  )
}

/**
 * The feed card. The whole card opens the post; the author row sits above the
 * card-wide link so it can open the writer's profile instead.
 */
export default function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  const meta = KIND_META[post.kind]
  const name = post.author?.full_name || 'A Revival Sound Tent member'
  const excerpt = post.body.replace(/\s+/g, ' ').trim()

  return (
    <article
      className="post-card bolt-card bolt-card--hover bolt-card--inset group relative flex flex-col overflow-hidden rounded-[26px] border border-white/[0.07] bg-surface transition-[transform,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-surface-raised"
      style={{ '--post-accent': meta.accent } as CSSProperties}
    >
      <span aria-hidden className="post-card__glow" />
      <div className={`relative flex flex-1 flex-col ${compact ? 'p-5' : 'p-6 sm:p-7'}`}>
        <header className="relative z-[2] flex items-center gap-3">
          <Link to={`/u/${post.author_id}`} className="flex min-w-0 items-center gap-3 rounded-full pr-2 transition-opacity hover:opacity-85">
            <AuthorAvatar author={post.author} size={compact ? 'h-8 w-8' : 'h-10 w-10'} text={compact ? 'text-[10px]' : 'text-xs'} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-foreground">{name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{[post.author?.city, timeAgo(post.created_at)].filter(Boolean).join(' · ')}</span>
            </span>
          </Link>
          {!compact && <span className="ml-auto"><KindChip kind={post.kind} type={post.opportunity_type} /></span>}
        </header>

        {compact && <span className="mt-4"><KindChip kind={post.kind} type={post.opportunity_type} /></span>}

        <h3 className={`mt-4 font-heading font-semibold leading-[1.15] tracking-[-0.015em] text-foreground ${compact ? 'text-lg' : 'text-[1.45rem] sm:text-[1.6rem]'}`}>
          <Link to={`/post/${post.id}`} className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-[26px] focus-visible:after:ring-2 focus-visible:after:ring-primary">{post.title}</Link>
        </h3>
        {post.body_html?.includes('data-mention')
          ? <p className={`mt-2.5 text-sm leading-6 text-muted-foreground ${compact ? 'line-clamp-2' : 'line-clamp-3'}`} dangerouslySetInnerHTML={{ __html: excerptHtml(post.body_html) }} />
          : excerpt && <p className={`mt-2.5 text-sm leading-6 text-muted-foreground ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>{excerpt}</p>}
        {post.media && post.media.length > 0 && <MediaPreview media={post.media} compact={compact} />}

        <footer className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-4' : 'mt-6'}`}>
          {post.scripture && (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[11px] font-medium text-foreground/85"><Bible className="h-3.5 w-3.5 text-primary" /> {post.scripture}</span>
          )}
          {!compact && post.tags.slice(0, 3).map(tag => <span key={tag} className="text-[11px] font-medium text-muted-foreground">#{tag}</span>)}
          <span className="ml-auto inline-flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readingMinutes(post.body)} min</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-foreground transition-all duration-300 group-hover:border-transparent group-hover:bg-[var(--post-accent)] group-hover:text-[#140609]"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </span>
        </footer>
        <div className="mt-3 border-t border-white/[0.07] pt-2"><PostActions postId={post.id} title={post.title} /></div>
      </div>
    </article>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-[26px] border border-white/[0.06] bg-surface p-6 sm:p-7" aria-hidden>
      <div className="flex items-center gap-3"><span className="h-10 w-10 animate-pulse rounded-full bg-white/[0.06]" /><span className="h-3 w-32 animate-pulse rounded-full bg-white/[0.06]" /></div>
      <div className="mt-5 h-6 w-3/4 animate-pulse rounded-full bg-white/[0.07]" />
      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-white/[0.05]" />
      <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-white/[0.05]" />
    </div>
  )
}

/** Up to four photos or videos on a feed card, in a tidy grid. */
function MediaPreview({ media, compact }: { media: PostMedia[]; compact: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  const shown = media.slice(0, compact ? 1 : 4)
  const extra = media.length - shown.length
  return (
    <><div className={`relative z-[2] mt-4 grid items-start gap-1.5 overflow-hidden rounded-[18px] ${shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {shown.map((item, index) => (
        <button type="button" aria-label={`Preview attachment ${index + 1}`} onClick={() => setOpen(index)} key={item.url} className="relative block w-full overflow-hidden rounded-xl bg-black">
          <MediaFrame item={item} alt={`Attachment ${index + 1}`} />
          {item.type === 'video' && <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md"><Play className="h-3.5 w-3.5" /></span>}
          {extra > 0 && index === shown.length - 1 && <span className="absolute inset-0 flex items-center justify-center bg-black/55 font-heading text-xl font-semibold text-white">+{extra}</span>}
        </button>
      ))}
    </div>{open !== null && <MediaViewer media={media} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}</>
  )
}
