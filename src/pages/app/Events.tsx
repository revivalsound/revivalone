import { useState } from 'react'
import { CalendarDays, Check, Clock, MapPin, Video, Zap } from '../../components/ui/icons'
import { CreateButton, PageHeader } from '../../components/app/AppShell'
import { EVENTS } from '../../lib/content'

const FILTERS = [
  { key: 'all', label: 'All formats' },
  { key: 'in-person', label: 'In person' },
  { key: 'online', label: 'Online' },
] as const

const GOING_KEY = 'revival.going'

export default function Events() {
  const [filter, setFilter] = useState<typeof FILTERS[number]['key']>('all')
  const [going, setGoing] = useState<string[]>(() => {
    try { return JSON.parse(window.localStorage.getItem(GOING_KEY) || '[]') } catch { return [] }
  })
  const events = EVENTS.filter(event => filter === 'all' || event.online === (filter === 'online'))
  const featured = EVENTS[1]

  const toggleGoing = (title: string) => setGoing(current => {
    const next = current.includes(title) ? current.filter(item => item !== title) : [...current, title]
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

      <section className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10">
        <div className="absolute inset-0 hero-field-fallback--vivid" />
        <div className="absolute inset-0 hero-field-scrim--vivid" />
        <div className="hero-strike" />
        <div className="relative grid gap-6 p-7 sm:p-9 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md"><Zap className="h-3.5 w-3.5 text-primary" /> Featured · {featured.category}</p>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl">{featured.title}</h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {featured.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {featured.time}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {featured.place}</span>
            </p>
          </div>
          <button type="button" onClick={() => toggleGoing(featured.title)} aria-pressed={going.includes(featured.title)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#070405] px-6 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            {going.includes(featured.title) ? <><Check className="h-4 w-4 text-primary" strokeWidth={2.4} /> You’re going</> : 'I’ll be there'}
          </button>
        </div>
      </section>

      <section id="event-directory" className="mt-12" aria-labelledby="directory-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="directory-heading" className="font-heading text-2xl font-semibold">Event directory</h2>
            <p className="mt-1 text-sm text-muted-foreground">Example listings. Dates and venues are illustrative.</p>
          </div>
          <div className="flex gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="group" aria-label="Filter by event format">
            {FILTERS.map(({ key, label }) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`h-8 rounded-full px-3.5 text-xs font-semibold transition-colors ${filter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {events.map(event => {
            const Place = event.online ? Video : MapPin
            const on = going.includes(event.title)
            const [month, day] = event.date.split(' ')
            return (
              <article key={event.title} className={`bolt-card flex flex-col gap-4 rounded-[24px] border p-5 transition-colors sm:flex-row sm:items-center sm:p-6 ${on ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-surface hover:border-white/[0.14]'}`}>
                <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 font-heading text-primary">
                  <span className="text-[11px] font-semibold uppercase">{month}</span>
                  <span className="text-2xl font-semibold leading-none">{day}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{event.category}</p>
                  <h3 className="mt-1 font-heading text-lg font-semibold">{event.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Place className="h-3.5 w-3.5" /> {event.place}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                  </p>
                </div>
                <button type="button" onClick={() => toggleGoing(event.title)} aria-pressed={on} className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-semibold transition-all active:scale-[0.97] ${on ? 'bg-primary text-primary-foreground' : 'border border-white/[0.1] bg-surface-raised hover:bg-white/[0.07]'}`}>
                  {on ? <><Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Going</> : 'I’ll be there'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
