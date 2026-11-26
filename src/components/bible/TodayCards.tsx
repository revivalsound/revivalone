import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bible, CalendarDays, ChevronRight, HandHeart, MapPin, Mic, Sunrise, Video } from '../ui/icons'
import { fetchPassageText, formatReference, guideDay, guideDayForDate, readerPath, readingLabel, verseOfTheDay, type Reference } from '../../lib/bible'
import { fetchPrayerWalls, fetchUpcoming, formatDay, wallStatus, type Initiative, type PrayerWall } from '../../lib/community'

/** Today's verse from the verse-of-the-day dataset, with its BSB text. */
export function useVerseOfTheDay() {
  const [verse, setVerse] = useState<(Reference & { holiday?: string; text?: string }) | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    verseOfTheDay().then(async reference => {
      if (!live) return
      if (!reference) { setVerse(null); return }
      setVerse(reference)
      const text = await fetchPassageText(reference).catch(() => '')
      if (live) setVerse({ ...reference, text })
    }).catch(() => live && setVerse(null))
    return () => { live = false }
  }, [])
  return verse
}

export function VerseOfTheDayCard() {
  const verse = useVerseOfTheDay()
  return (
    <Link to="/guide" className="bolt-card bolt-card--hover bolt-card--inset group relative flex min-h-[240px] overflow-hidden rounded-[24px] border border-white/10">
      <img src="/assets/revival-dawn.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[75%_50%] transition-transform duration-700 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/15" />
      <div className="relative mt-auto p-6">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary"><Sunrise className="h-4 w-4" /> Verse of the day{verse?.holiday ? ` · ${verse.holiday}` : ''}</p>
        {verse === undefined ? <div className="mt-3 space-y-2"><div className="h-4 w-11/12 animate-pulse rounded-full bg-white/10" /><div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" /></div>
          : verse ? <>
            <p className="mt-2 line-clamp-5 font-scripture text-[1.05rem] leading-7 text-white">“{verse.text || '…'}”</p>
            <p className="mt-2 font-heading text-xs font-semibold text-white/80">{formatReference(verse)}</p>
          </> : <p className="mt-2 text-sm text-white/75">Open today’s guide.</p>}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/85">Today’s guide <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  )
}

export function TodaysReadingsCard() {
  const day = guideDayForDate()
  const plan = guideDay(day)
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Bible className="h-4 w-4 text-primary" /> Daily guide · Day {day}</p>
        <Link to="/guide" className="text-xs font-semibold text-primary hover:text-primary/80">Open</Link>
      </div>
      <ul className="mt-3 space-y-2">
        {plan.readings.map(reading => (
          <li key={`${reading.book}${reading.from}`}>
            <Link to={readerPath({ book: reading.book, chapter: reading.from })} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-[13px] font-medium transition-colors hover:bg-white/[0.07]">
              {readingLabel(reading)} <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Prayer walls that are live now, or the next ones coming up. */
export function PrayerWallsCard() {
  const [walls, setWalls] = useState<PrayerWall[] | null>(null)
  useEffect(() => { fetchPrayerWalls().then(list => setWalls(list.slice(0, 3))).catch(() => setWalls([])) }, [])
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><HandHeart className="h-4 w-4 text-primary" /> Prayer walls</p>
        <Link to="/community/prayer" className="text-xs font-semibold text-primary hover:text-primary/80">All</Link>
      </div>
      {walls === null ? <div className="mt-3 h-10 animate-pulse rounded-xl bg-white/[0.05]" />
        : walls.length ? (
          <ul className="mt-3 space-y-2">
            {walls.map(wall => {
              const live = wallStatus(wall) === 'live'
              return (
                <li key={wall.id}>
                  <Link to={`/prayer/${wall.code}`} className="flex items-center gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-white/[0.04]">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${live ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}><Mic className="h-4 w-4" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{wall.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{live ? 'Live now' : formatDay(wall.starts_at)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <Link to="/community/prayer" className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium hover:bg-white/[0.07]">Start a prayer wall <ArrowRight className="h-3.5 w-3.5 text-primary" /></Link>
        )}
    </div>
  )
}

export function ComingUpCard() {
  const [events, setEvents] = useState<Initiative<'event' | 'bootcamp'>[] | null>(null)
  useEffect(() => { fetchUpcoming().then(list => setEvents(list.slice(0, 3))).catch(() => setEvents([])) }, [])
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><CalendarDays className="h-4 w-4 text-primary" /> Coming up</p>
        <Link to="/events" className="text-xs font-semibold text-primary hover:text-primary/80">All events</Link>
      </div>
      {events === null ? <div className="mt-3 h-10 animate-pulse rounded-xl bg-white/[0.05]" />
        : events.length ? (
          <ul className="mt-3 space-y-3">
            {events.map(event => {
              const online = event.details.format === 'online'
              const Place = online ? Video : MapPin
              return (
                <li key={event.id} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 font-heading text-primary">
                    <span className="text-[9px] font-semibold uppercase">{formatDay(event.starts_at, { month: 'short' })}</span>
                    <span className="text-sm font-semibold leading-none">{formatDay(event.starts_at, { day: 'numeric' })}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{event.title}</span>
                    <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><Place className="h-3 w-3" /> {online ? 'Online' : event.city}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <Link to="/create/event" className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium hover:bg-white/[0.07]">Host the first gathering <ArrowRight className="h-3.5 w-3.5 text-primary" /></Link>
        )}
    </div>
  )
}
