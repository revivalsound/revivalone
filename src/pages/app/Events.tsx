import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CalendarDays, Check, Clock, MapPin, Video, Zap } from '../../components/ui/icons'
import { Deck } from '../../components/ui/kit'
import { CreateButton, PageHeader } from '../../components/app/AppShell'
import { EventCard, MediaCover } from '../../components/community/cards'
import { EXAMPLE_EVENTS, fetchUpcoming, formatDay, formatTime, type EventDetails, type Initiative } from '../../lib/community'

const FILTERS = [
  { key: 'all', label: 'Everything' },
  { key: 'event', label: 'Events' },
  { key: 'bootcamp', label: 'Bootcamps' },
  { key: 'online', label: 'Online' },
] as const

const GOING_KEY = 'revival.going'

export default function Events() {
  const { state } = useLocation() as { state?: { created?: string } }
  const [filter, setFilter] = useState<typeof FILTERS[number]['key']>('all')
  const [real, setReal] = useState<Initiative<'event' | 'bootcamp'>[]>([])
  const [going, setGoing] = useState<string[]>(() => {
    try { return JSON.parse(window.localStorage.getItem(GOING_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => { fetchUpcoming().then(setReal).catch(() => setReal([])) }, [])

  // Real listings first, then the examples, all in date order within each group.
  const all = [...real, ...EXAMPLE_EVENTS.slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at))]
  const shown = all.filter(item => filter === 'all'
    || (filter === 'online' ? item.details.format === 'online' : item.kind === filter))
  const featured = all.find(item => item.id === state?.created) ?? real.find(item => item.media_url) ?? real[0] ?? EXAMPLE_EVENTS.find(item => item.title === 'The Upper Room') ?? all[0]
  const featuredDetails = featured.details as Partial<EventDetails>

  const toggleGoing = (id: string) => setGoing(current => {
    const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    try { window.localStorage.setItem(GOING_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    return next
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Events"
        title={<>Step into <span className="text-primary">the room.</span></>}
        lede="Gather for worship, prayer, training and local mission."
        action={<CreateButton kind="event">Create an event</CreateButton>}
      />

      <section className="bolt-card bolt-card--inset bolt-card--hover group relative mt-8 overflow-hidden rounded-[30px] border border-white/10">
        <MediaCover initiative={featured} className="min-h-[360px] sm:min-h-[420px]">
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
          <div className="hero-strike" />
          <div className="absolute inset-x-0 bottom-0 z-[2] grid gap-6 p-7 sm:p-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md"><Zap className="h-3.5 w-3.5 text-primary" /> Featured · {featured.kind === 'bootcamp' ? 'Gospel bootcamp' : featuredDetails.category ?? 'Event'}</p>
              <h2 className="mt-5 max-w-2xl font-heading text-4xl font-semibold leading-[1.04] tracking-[-0.02em] text-white sm:text-[3.4rem]">{featured.title}</h2>
              <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/85">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> {formatDay(featured.starts_at, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                {featuredDetails.start_time && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {formatTime(featuredDetails.start_time)}</span>}
                <span className="flex items-center gap-1.5">{featuredDetails.format === 'online' ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />} {featuredDetails.format === 'online' ? 'Online' : [featuredDetails.venue, featured.city].filter(Boolean).join(' · ')}</span>
              </p>
            </div>
            <button type="button" onClick={() => toggleGoing(featured.id)} aria-pressed={going.includes(featured.id)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_14px_34px_rgba(255,92,138,0.35)] transition-all hover:-translate-y-0.5 active:scale-[0.98]">
              {going.includes(featured.id) ? <><Check className="h-4 w-4" strokeWidth={2.4} /> You’re going</> : 'I’ll be there'}
            </button>
          </div>
        </MediaCover>
      </section>

      <section className="mt-12" aria-labelledby="directory-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="directory-heading" className="font-heading text-2xl font-semibold">Coming up</h2>
            <p className="mt-1 text-sm text-muted-foreground">{real.length ? 'Gatherings from the community, plus a few example listings.' : 'Example listings for now. Create one and it appears here.'}</p>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="group" aria-label="Filter listings">
            {FILTERS.map(({ key, label }) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors ${filter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
            ))}
          </div>
        </div>

        <Deck key={filter} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(item => <EventCard key={item.id} initiative={item} going={going.includes(item.id)} onToggleGoing={() => toggleGoing(item.id)} />)}
        </Deck>
        {shown.length === 0 && <p className="mt-6 rounded-[24px] border border-dashed border-white/[0.1] px-5 py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
      </section>
    </div>
  )
}
