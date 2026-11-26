import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bolt, CalendarAdd, Check, Clock, Copy, HandHeart, Link as LinkIcon, Loader, Mic, Users, X } from '../../components/ui/icons'
import { Notice, inputClass } from '../../components/ui/kit'
import { PageHeader } from '../../components/app/AppShell'
import CommunityTabs from '../../components/community/CommunityTabs'
import { AuthorAvatar } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { CommunityNotReady, createPrayerWall, fetchPrayerWalls, formatClock, formatDay, normaliseWallCode, wallStatus, type PrayerWall } from '../../lib/community'

const DURATIONS = [15, 30, 60, 90, 120, 180]
const durationLabel = (minutes: number) => minutes < 60 ? `${minutes} min` : `${minutes / 60} hr${minutes > 60 ? 's' : ''}`

type Mode = 'instant' | 'schedule' | null

export default function PrayerWalls() {
  const navigate = useNavigate()
  const [walls, setWalls] = useState<PrayerWall[] | null>(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [scheduled, setScheduled] = useState<PrayerWall | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    fetchPrayerWalls().then(setWalls).catch(caught => { setWalls([]); setError(caught instanceof Error ? caught.message : 'We couldn’t load prayer walls.') })
    const tick = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(tick)
  }, [])

  function join(event: FormEvent) {
    event.preventDefault()
    const normalised = normaliseWallCode(code)
    if (!normalised) { setCodeError('Enter a code like abc-defg-hij or paste the invite link.'); return }
    navigate(`/prayer/${normalised}`)
  }

  const created = (wall: PrayerWall, instant: boolean) => {
    setMode(null)
    if (instant) navigate(`/prayer/${wall.code}`)
    else { setScheduled(wall); setWalls(current => [...(current ?? []), wall].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) }
  }

  const live = (walls ?? []).filter(wall => wallStatus(wall, now) === 'live')
  const upcoming = (walls ?? []).filter(wall => wallStatus(wall, now) !== 'live' && wallStatus(wall, now) !== 'ended')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Community"
        title={<>Pray together, <span className="text-primary">live.</span></>}
        lede="A prayer wall is a live audio room with a purpose and a time frame. Start one now, join with a code, or schedule one for later."
      />
      <CommunityTabs />

      {/* Meet-style launcher */}
      <section className="relative mt-8 overflow-hidden rounded-[30px] border border-white/10">
        <div className="absolute inset-0 hero-field-fallback--vivid" />
        <div className="absolute inset-0 hero-field-scrim--vivid" />
        <div className="hero-strike" />
        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-[#1a0610] text-primary"><HandHeart className="h-6 w-6" /></span>
            <h2 className="mt-6 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.6rem]">Where two or three gather, <span className="text-[#ffd0dd]">He is there.</span></h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/75">Everyone joins by voice. When the time frame ends, the wall closes.</p>
          </div>
          <div className="space-y-3">
            <button type="button" onClick={() => setMode('instant')} className="bolt-card bolt-card--hover group flex w-full items-center gap-4 rounded-[22px] bg-[#070405]/85 p-4 text-left backdrop-blur-xl transition-transform hover:-translate-y-0.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(255,92,138,0.35)]"><Bolt className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><b className="block font-heading text-[15px] font-semibold text-white">Start an instant prayer wall</b><small className="text-xs text-white/60">Open a room now and invite people in.</small></span>
              <ArrowRight className="h-4 w-4 text-white/60 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button type="button" onClick={() => setMode('schedule')} className="bolt-card bolt-card--hover group flex w-full items-center gap-4 rounded-[22px] bg-[#070405]/85 p-4 text-left backdrop-blur-xl transition-transform hover:-translate-y-0.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><CalendarAdd className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><b className="block font-heading text-[15px] font-semibold text-white">Schedule a prayer wall</b><small className="text-xs text-white/60">Pick a time and share the link ahead.</small></span>
              <ArrowRight className="h-4 w-4 text-white/60 transition-transform group-hover:translate-x-0.5" />
            </button>
            <form onSubmit={join} className="flex items-center gap-2 rounded-[22px] bg-[#070405]/85 p-2 pl-4 backdrop-blur-xl">
              <LinkIcon className="h-5 w-5 shrink-0 text-primary" />
              <input value={code} onChange={event => { setCode(event.target.value); setCodeError('') }} placeholder="Enter a code or link" aria-label="Prayer wall code" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45" />
              <button type="submit" disabled={!code.trim()} className="h-11 shrink-0 rounded-full bg-white px-5 text-sm font-semibold text-[#140609] transition-opacity disabled:opacity-40">Join</button>
            </form>
            {codeError && <p className="px-2 text-xs text-[#ffd0dd]">{codeError}</p>}
          </div>
        </div>
      </section>

      {scheduled && <ScheduledNotice wall={scheduled} onClose={() => setScheduled(null)} />}
      {error && <div className="mt-6"><Notice tone="error">{error}</Notice></div>}

      <WallList title="Live now" empty="No prayer walls are live right now. Start one and invite others in." walls={walls === null ? null : live} now={now} />
      <WallList title="Coming up" empty="Nothing scheduled in the next two weeks." walls={walls === null ? null : upcoming} now={now} />

      {mode && <WallDialog instant={mode === 'instant'} onClose={() => setMode(null)} onCreated={created} />}
    </div>
  )
}

function WallList({ title, walls, empty, now }: { title: string; walls: PrayerWall[] | null; empty: string; now: number }) {
  return (
    <section className="mt-12" aria-label={title}>
      <h2 className="flex items-center gap-2.5 font-heading text-2xl font-semibold">
        {title === 'Live now' && <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" /></span>}
        {title}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {walls === null && <><div className="h-48 animate-pulse rounded-[26px] bg-surface" /><div className="h-48 animate-pulse rounded-[26px] bg-surface" /></>}
        {walls?.map(wall => <WallCard key={wall.id} wall={wall} now={now} />)}
      </div>
      {walls?.length === 0 && <p className="rounded-[24px] border border-dashed border-white/[0.1] px-5 py-10 text-center text-sm text-muted-foreground">{empty}</p>}
    </section>
  )
}

function WallCard({ wall, now }: { wall: PrayerWall; now: number }) {
  const status = wallStatus(wall, now)
  const isLive = status === 'live'
  const minutesLeft = Math.ceil((new Date(wall.ends_at).getTime() - now) / 60_000)
  return (
    <Link to={`/prayer/${wall.code}`} className={`bolt-card group flex flex-col rounded-[26px] border p-6 transition-[transform,background-color] duration-300 hover:-translate-y-0.5 ${isLive ? 'bolt-card--on border-transparent bg-surface-raised' : 'bolt-card--hover border-white/[0.07] bg-surface hover:bg-surface-raised'}`}>
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${isLive ? 'bg-primary text-primary-foreground' : 'border border-white/[0.09] text-muted-foreground'}`}>
          {isLive ? <><Mic className="h-3.5 w-3.5" /> Live · {minutesLeft} min left</> : <><Clock className="h-3.5 w-3.5" /> {status === 'opening' ? 'Opening soon' : formatDay(wall.starts_at)}</>}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{wall.code}</span>
      </div>
      <h3 className="mt-5 font-heading text-lg font-semibold leading-tight">{wall.title}</h3>
      {wall.purpose && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{wall.purpose}</p>}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="flex min-w-0 items-center gap-2">
          <AuthorAvatar author={wall.host ?? null} size="h-7 w-7" text="text-[9px]" />
          <span className="truncate text-xs text-muted-foreground">Hosted by {wall.host?.full_name || 'a member'}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-foreground/80">{formatClock(wall.starts_at)} – {formatClock(wall.ends_at)}</span>
      </div>
    </Link>
  )
}

function ScheduledNotice({ wall, onClose }: { wall: PrayerWall; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/prayer/${wall.code}`
  return (
    <div className="dialog-in mt-6 flex flex-col gap-4 rounded-[24px] border border-primary/30 bg-primary/[0.07] p-5 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-5 w-5" strokeWidth={2.4} /></span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] font-semibold">“{wall.title}” is scheduled</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDay(wall.starts_at, { weekday: 'long', month: 'long', day: 'numeric' })}, {formatClock(wall.starts_at)} – {formatClock(wall.ends_at)} · code <span className="font-mono text-foreground">{wall.code}</span></p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800) }) }} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground">{copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy invite link</>}</button>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

/** Local date/time inputs, defaulting to the next half hour. */
function defaultStart() {
  const date = new Date(Date.now() + 60 * 60_000)
  date.setMinutes(date.getMinutes() < 30 ? 30 : 60, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return { day: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(date.getHours())}:${pad(date.getMinutes())}` }
}

function WallDialog({ instant, onClose, onCreated }: { instant: boolean; onClose: () => void; onCreated: (wall: PrayerWall, instant: boolean) => void }) {
  const { session } = useAuth()
  const dialog = useRef<HTMLDialogElement>(null)
  const [duration, setDuration] = useState(instant ? 30 : 60)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const start = defaultStart()

  useEffect(() => { dialog.current?.showModal() }, [])
  const close = () => { if (!saving) dialog.current?.close() }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startsAt = instant ? new Date() : new Date(`${form.get('day')}T${form.get('time')}`)
    if (!instant && startsAt.getTime() < Date.now() - 60_000) { setError('Pick a time in the future.'); return }
    setSaving(true); setError('')
    try {
      const wall = await createPrayerWall({
        title: String(form.get('title') ?? '').trim(),
        purpose: String(form.get('purpose') ?? '').trim(),
        starts_at: startsAt.toISOString(),
        ends_at: new Date(startsAt.getTime() + duration * 60_000).toISOString(),
      })
      onCreated(wall, instant)
    } catch (caught) {
      setError(caught instanceof CommunityNotReady || caught instanceof Error ? caught.message : 'We couldn’t create the prayer wall.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="revival-dialog" aria-labelledby="wall-title" onClose={onClose}>
      <div className="dialog-in fixed inset-x-0 bottom-0 m-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border glass glass-strong p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-0 sm:h-fit sm:rounded-[28px] sm:p-7">
        <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"><X className="h-4 w-4" /></button>
        {!session ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><HandHeart className="h-6 w-6" /></span>
            <h2 id="wall-title" className="mt-5 font-heading text-2xl font-semibold">Sign in to host a prayer wall</h2>
            <Link to="/auth?next=/community/prayer" onClick={close} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{instant ? 'Instant prayer wall' : 'Schedule a prayer wall'}</p>
              <h2 id="wall-title" className="mt-2 pr-10 font-heading text-2xl font-semibold">What are we praying for?</h2>
            </div>
            <label className="block text-xs font-medium text-foreground/90">Title<input required name="title" minLength={3} maxLength={120} placeholder="Prayer for exams week" className={`${inputClass} mt-2 px-4`} /></label>
            <label className="block text-xs font-medium text-foreground/90">Purpose <span className="text-muted-foreground">(optional)</span><textarea name="purpose" maxLength={1000} rows={3} placeholder="Share what this prayer wall is for so people come ready." className={`${inputClass} mt-2 h-auto px-4 py-3`} /></label>
            {!instant && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-foreground/90">Date<input required name="day" type="date" defaultValue={start.day} className={`${inputClass} mt-2 px-4 [color-scheme:dark]`} /></label>
                <label className="block text-xs font-medium text-foreground/90">Start time<input required name="time" type="time" defaultValue={start.time} className={`${inputClass} mt-2 px-4 [color-scheme:dark]`} /></label>
              </div>
            )}
            <fieldset>
              <legend className="text-xs font-medium text-foreground/90">Time frame</legend>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {DURATIONS.map(minutes => (
                  <button key={minutes} type="button" aria-pressed={duration === minutes} onClick={() => setDuration(minutes)} className={`h-10 rounded-full border text-xs font-semibold transition-colors ${duration === minutes ? 'border-primary bg-primary text-primary-foreground' : 'border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:text-foreground'}`}>{durationLabel(minutes)}</button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">The wall closes automatically when its time is up.</p>
            </fieldset>
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-60">
              {saving ? <><Loader className="h-4 w-4 animate-spin" /> Creating…</> : instant ? <><Mic className="h-4 w-4" /> Start now</> : <><CalendarAdd className="h-4 w-4" /> Schedule it</>}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><Users className="h-3.5 w-3.5" /> Anyone with the code can join while it’s open.</p>
          </form>
        )}
      </div>
    </dialog>
  )
}
