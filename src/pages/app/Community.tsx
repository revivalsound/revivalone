import { useMemo, useState } from 'react'
import { Check, Clock, HandHeart, Heart, MapPin, Search, Users } from '../../components/ui/icons'
import { Deck } from '../../components/ui/kit'
import { CreateButton, PageHeader } from '../../components/app/AppShell'
import { CELLS, PRAYERS } from '../../lib/content'

const PRAYED_KEY = 'revival.prayed'

function loadPrayed(): string[] {
  try { return JSON.parse(window.localStorage.getItem(PRAYED_KEY) || '[]') } catch { return [] }
}

export default function Community() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('All cities')
  const [prayed, setPrayed] = useState<string[]>(loadPrayed)
  const cities = useMemo(() => ['All cities', ...new Set(CELLS.map(cell => cell.city))], [])
  const cells = CELLS.filter(cell =>
    (city === 'All cities' || cell.city === city)
    && `${cell.name} ${cell.focus}`.toLowerCase().includes(query.trim().toLowerCase()))

  const togglePrayed = (title: string) => setPrayed(current => {
    const next = current.includes(title) ? current.filter(item => item !== title) : [...current, title]
    try { window.localStorage.setItem(PRAYED_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    return next
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Community"
        title={<>We carry the flame <span className="text-primary">together.</span></>}
        lede="Find a local cell and make room to pray with other believers."
        action={<CreateButton kind="cell">Start a cell</CreateButton>}
      />

      <nav className="mt-6 flex gap-2" aria-label="Community sections">
        {[['#revival-cells', 'Revival cells'], ['#prayer-wall', 'Prayer wall']].map(([href, label]) => (
          <a key={href} href={href} className="inline-flex h-9 items-center rounded-full border border-white/[0.09] bg-white/[0.03] px-4 text-xs font-semibold text-foreground/85 transition-colors hover:bg-white/[0.07]">{label}</a>
        ))}
      </nav>

      <section className="relative mt-8 grid overflow-hidden rounded-[28px] border border-primary bg-primary p-7 text-primary-foreground sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#070405] text-primary"><Users className="h-5 w-5" /></span>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Faith has an address.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/75">Revival cells are small groups for prayer, Scripture and serving the place you call home.</p>
        </div>
        <img src="/assets/revival-flame-mark.png" alt="" className="relative mt-6 h-36 w-36 object-contain opacity-90 [filter:brightness(0)_opacity(0.18)] sm:mt-0" />
      </section>

      <section id="revival-cells" className="mt-12 scroll-mt-20" aria-labelledby="cells-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="cells-heading" className="font-heading text-2xl font-semibold">Revival cells</h2>
            <p className="mt-1 text-sm text-muted-foreground">Example communities and meeting times.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search cells</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search cells" className="h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.03] pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 sm:w-52" />
            </label>
            <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="group" aria-label="Filter by city">
              {cities.map(name => (
                <button key={name} type="button" aria-pressed={city === name} onClick={() => setCity(name)} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors ${city === name ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{name}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cells.map(cell => (
            <article key={cell.name} className="bolt-card bolt-card--hover flex flex-col rounded-[24px] border border-white/[0.07] bg-surface p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-heading text-sm font-semibold text-primary">{cell.initials}</span>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{cell.members} members</span>
              </div>
              <h3 className="mt-6 font-heading text-lg font-semibold">{cell.name}</h3>
              <p className="mt-1 text-xs font-medium text-primary">{cell.focus}</p>
              <div className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {cell.city}</p>
                <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {cell.schedule}</p>
              </div>
            </article>
          ))}
          {cells.length === 0 && <p className="rounded-[24px] border border-dashed border-white/[0.1] p-8 text-center text-sm text-muted-foreground md:col-span-2 lg:col-span-3">No cells match yet. Start one in your city.</p>}
        </div>
      </section>

      <section id="prayer-wall" className="mt-12 scroll-mt-20" aria-labelledby="prayer-heading">
        <h2 id="prayer-heading" className="font-heading text-2xl font-semibold">Prayer wall</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bring these requests into your time of prayer.</p>
        <Deck className="mt-5 grid gap-3 md:grid-cols-2">
          {PRAYERS.map(prayer => {
            const on = prayed.includes(prayer.title)
            return (
              <article key={prayer.title} className={`bolt-card flex flex-col rounded-[24px] border p-6 transition-colors ${on ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-surface'}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><HandHeart className="h-5 w-5" /></span>
                <h3 className="mt-5 font-heading text-lg font-semibold">{prayer.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{prayer.text}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Heart className="h-3.5 w-3.5 text-primary" /> {prayer.praying + (on ? 1 : 0)} praying</span>
                  <button type="button" onClick={() => togglePrayed(prayer.title)} aria-pressed={on} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all active:scale-[0.97] ${on ? 'bg-primary text-primary-foreground' : 'border border-white/[0.1] bg-surface-raised hover:bg-white/[0.07]'}`}>
                    {on ? <><Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Praying</> : 'I’ll pray'}
                  </button>
                </div>
              </article>
            )
          })}
        </Deck>
      </section>
    </div>
  )
}
