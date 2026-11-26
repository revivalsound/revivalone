import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, Users } from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import { PageHeader } from '../../components/app/AppShell'
import CommunityTabs from '../../components/community/CommunityTabs'
import { CellCard } from '../../components/community/cards'
import { cellFocuses, fetchCells, type Initiative } from '../../lib/community'

/** Revival cells: only cell groups live here. Each one opens its group chat. */
export default function RevivalCells() {
  const [cells, setCells] = useState<Initiative<'cell'>[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('All cities')

  useEffect(() => {
    fetchCells().then(setCells).catch(caught => { setCells([]); setError(caught instanceof Error ? caught.message : 'We couldn’t load the cells.') })
  }, [])

  const cities = useMemo(() => ['All cities', ...new Set((cells ?? []).map(cell => cell.city).filter(Boolean))], [cells])
  const shown = (cells ?? []).filter(cell =>
    (city === 'All cities' || cell.city === city)
    && `${cell.title} ${cellFocuses(cell.details).join(' ')} ${cell.details.area ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Community"
        title={<>Faith has <span className="text-primary">an address.</span></>}
        lede="Revival cells are small groups for prayer, Scripture and serving the place you call home. Open one to join its group chat."
        action={<Link to="/create/cell" className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-primary pl-5 pr-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.24)] transition-all hover:-translate-y-0.5 sm:self-auto">Start a cell <span className="flex h-8 w-8 items-center justify-center rounded-full bg-shell text-primary"><ArrowRight className="h-4 w-4" /></span></Link>}
      />
      <CommunityTabs />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative">
          <span className="sr-only">Search cells</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name, focus or area" className="h-11 w-full rounded-full border border-white/[0.09] bg-white/[0.03] pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 sm:w-72" />
        </label>
        {cities.length > 2 && (
          <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="group" aria-label="Filter by city">
            {cities.map(name => (
              <button key={name} type="button" aria-pressed={city === name} onClick={() => setCity(name)} className={`h-9 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors ${city === name ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{name}</button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="mt-5"><Notice tone="error">{error}</Notice></div>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cells === null && Array.from({ length: 3 }, (_, index) => <div key={index} className="h-[330px] animate-pulse rounded-[26px] border border-white/[0.06] bg-surface" />)}
        {shown.map(cell => <CellCard key={cell.id} cell={cell} />)}
      </div>

      {cells !== null && shown.length === 0 && !error && (
        <div className="mt-2 rounded-[26px] border border-dashed border-white/[0.1] bg-surface/60 px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Users className="h-6 w-6" /></span>
          <h2 className="mt-5 font-heading text-xl font-semibold">{cells.length ? 'No cells match that search' : 'No revival cells yet'}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Start one where you live. You’ll lead it, and its group chat opens straight away.</p>
          <Link to="/create/cell" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Start a cell <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
    </div>
  )
}
