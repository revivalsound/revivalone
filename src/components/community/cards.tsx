import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Chat, Check, Clock, Fire, MapPin, Play, Users, Video } from '../ui/icons'
import { FORMAT_LABEL, formatDay, formatTime, type BootcampDetails, type CellDetails, type EventDetails, type Initiative } from '../../lib/community'

/* Generated cover art for listings without media: a warm mesh tinted per category. */
const PALETTES = [
  ['#ff5c8a', '#7a1438', '#ffb36b'],
  ['#d7b8ff', '#3b1452', '#ff5c8a'],
  ['#ffb36b', '#5a1a0c', '#ff5c8a'],
  ['#ff8fb0', '#2a0b1a', '#d7b8ff'],
  ['#ffd479', '#4a1a10', '#ff5c8a'],
]

function paletteFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

/**
 * The cover for an event, bootcamp or cell. Photos fill it; videos show their
 * first frame and play muted on hover; anything else gets generated art.
 */
export function MediaCover({ initiative, className = '', children }: { initiative: Pick<Initiative, 'media_url' | 'media_type' | 'title'> & { details?: { category?: string; track?: string; focus?: string } }; className?: string; children?: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null)
  const seed = initiative.details?.category ?? initiative.details?.track ?? initiative.details?.focus ?? initiative.title
  const [a, b, c] = paletteFor(seed)
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => { void video.current?.play().catch(() => undefined) }}
      onMouseLeave={() => { if (video.current) { video.current.pause(); video.current.currentTime = 0 } }}
    >
      {initiative.media_url && initiative.media_type === 'image' && (
        <img src={initiative.media_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      )}
      {initiative.media_url && initiative.media_type === 'video' && (
        <>
          <video ref={video} src={`${initiative.media_url}#t=0.1`} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
          <span className="absolute right-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"><Play className="h-3.5 w-3.5" /></span>
        </>
      )}
      {!initiative.media_url && (
        <div aria-hidden className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]" style={{ background: `radial-gradient(90% 80% at 85% 10%, ${a}cc, transparent 60%), radial-gradient(80% 90% at 0% 100%, ${c}99, transparent 60%), linear-gradient(160deg, ${b}, #0b0607 85%)` }}>
          <img src="/assets/revival-flame-mark.png" alt="" className="absolute -bottom-6 -right-4 h-36 w-36 object-contain opacity-25 mix-blend-screen" />
          <span className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {children}
    </div>
  )
}

function DateBadge({ iso }: { iso: string }) {
  return (
    <span className="absolute left-4 top-4 z-[2] flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-white/15 bg-black/40 font-heading text-white backdrop-blur-md">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{formatDay(iso, { month: 'short' })}</span>
      <span className="text-xl font-semibold leading-none">{formatDay(iso, { day: 'numeric' })}</span>
    </span>
  )
}

/** Event and gospel bootcamp listing. */
export function EventCard({ initiative, going, onToggleGoing }: { initiative: Initiative<'event' | 'bootcamp'>; going: boolean; onToggleGoing: () => void }) {
  const isBootcamp = initiative.kind === 'bootcamp'
  const details = initiative.details as Partial<EventDetails & BootcampDetails>
  const format = details.format ?? 'in_person'
  const Place = format === 'online' ? Video : MapPin
  const place = format === 'online' ? 'Online' : [details.venue, initiative.city].filter(Boolean).filter((part, index, all) => all.indexOf(part) === index).join(' · ')
  const label = isBootcamp ? `Gospel bootcamp${details.track ? ` · ${details.track}` : ''}` : details.category ?? 'Event'

  return (
    <article className={`bolt-card bolt-card--inset group relative flex flex-col overflow-hidden rounded-[26px] border bg-surface transition-[transform,border-color] duration-300 hover:-translate-y-0.5 ${going ? 'bolt-card--on border-transparent' : 'bolt-card--hover border-white/[0.07] hover:border-white/[0.14]'}`}>
      <MediaCover initiative={initiative} className="aspect-[16/10]">
        <DateBadge iso={initiative.starts_at} />
        <span className="absolute right-4 top-4 z-[2] rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">{FORMAT_LABEL[format]}</span>
        <div className="absolute inset-x-0 bottom-0 z-[2] p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{isBootcamp ? <Fire className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />} {label}</p>
          <h3 className="mt-1.5 font-heading text-xl font-semibold leading-tight text-white">{initiative.title}</h3>
        </div>
      </MediaCover>
      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><Place className="h-3.5 w-3.5 text-primary/80" /> <span className="truncate">{place || 'Venue to be announced'}</span></p>
          <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary/80" /> {formatDay(initiative.starts_at)}{details.start_time ? ` · ${formatTime(details.start_time)}` : ''}{isBootcamp && details.weeks ? ` · ${details.weeks} week${details.weeks > 1 ? 's' : ''}` : ''}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-[11px] text-muted-foreground">{initiative.example ? 'Example listing' : details.capacity ? `${details.capacity} places` : 'Open to all'}</span>
          <button type="button" onClick={onToggleGoing} aria-pressed={going} className={`inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-semibold transition-all active:scale-[0.97] ${going ? 'bg-primary text-primary-foreground' : 'border border-white/[0.1] bg-surface-raised hover:bg-white/[0.07]'}`}>
            {going ? <><Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Going</> : 'I’ll be there'}
          </button>
        </div>
      </div>
    </article>
  )
}

/** Revival cell listing; opens the cell's group chat. */
export function CellCard({ cell }: { cell: Initiative<'cell'> }) {
  const details = cell.details as Partial<CellDetails>
  const schedule = [details.meeting_day && `${details.meeting_day}s`, formatTime(details.start_time)].filter(Boolean).join(' · ')
  const initials = cell.title.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
  return (
    <Link to={`/community/cells/${cell.id}`} className="bolt-card bolt-card--hover bolt-card--inset group relative flex flex-col overflow-hidden rounded-[26px] border border-white/[0.07] bg-surface transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/[0.14]">
      <MediaCover initiative={cell} className="h-36">
        <span className="absolute right-4 top-4 z-[2] inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md"><Users className="h-3 w-3" /> {cell.member_count ?? 0}{details.max_members ? ` / ${details.max_members}` : ''}</span>
      </MediaCover>
      <span className="relative z-[2] -mt-7 ml-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#1a0610] font-heading text-base font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.45)]">{initials}</span>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <h3 className="font-heading text-lg font-semibold leading-tight">{cell.title}</h3>
        {details.focus && <p className="mt-1 text-xs font-medium text-primary">{details.focus}</p>}
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{cell.description}</p>
        <div className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {details.format === 'online' ? 'Online' : [details.area, cell.city].filter(Boolean).join(', ')}</p>
          {schedule && <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {schedule}</p>}
        </div>
        <span className="mt-5 inline-flex items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-4 pr-1.5 text-xs font-semibold transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
          <span className="flex items-center gap-1.5"><Chat className="h-4 w-4 text-primary" /> Open group chat</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </span>
      </div>
    </Link>
  )
}
