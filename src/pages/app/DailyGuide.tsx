import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Bible, BookOpen, Check, ChevronLeft, ChevronRight, Fire, HandHeart, Loader, Notebook, Share, Sunrise } from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import { useAuth } from '../../lib/AuthContext'
import {
  dateForGuideDay, DEFAULT_TRANSLATION, fetchCommentary, fetchPassageText, formatReference, GUIDE_DAYS, guideDay, guideDayForDate,
  readerPath, readingKey, readingLabel, TRACK_LABEL, verseOfTheDay, type GuideReading, type Reference,
} from '../../lib/bible'
import { fetchGuideYear, saveGuideDay, streak, type GuideProgress } from '../../lib/reading'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Questions to sit with after the day's reading, one set per weekday.
const PROMPTS = [
  ['What does today’s reading show you about who God is?', 'Where do you see His faithfulness in these chapters?'],
  ['Which verse stood out to you, and why?', 'What is one thing you can obey today?'],
  ['What does this passage show you about people, and about you?', 'Is there something to confess or to give thanks for?'],
  ['How does today’s reading point to Jesus?', 'Who could you share this with this week?'],
  ['What promise of God can you hold on to from today?', 'What worry can you hand to Him in prayer?'],
  ['What would change if you lived this passage out today?', 'Who can you pray for because of what you read?'],
  ['Looking back on the week’s reading, what has God been teaching you?', 'How will you rest in Him today?'],
]

const empty = (year: number, day: number): GuideProgress => ({ year, day, readings: [], completed_at: null, reflection: '', prayer: '' })

export default function DailyGuide() {
  const params = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const now = new Date()
  const year = now.getFullYear()
  const today = guideDayForDate(now)
  const day = Math.min(Math.max(Number(params.day) || today, 1), GUIDE_DAYS)
  const date = dateForGuideDay(day, year)
  const plan = guideDay(day)

  const [entries, setEntries] = useState<Map<number, GuideProgress>>(new Map())
  const [loadError, setLoadError] = useState('')
  const [month, setMonth] = useState(date.getMonth())
  const [draft, setDraft] = useState<GuideProgress>(empty(year, day))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [votd, setVotd] = useState<(Reference & { holiday?: string; text?: string }) | null | undefined>(undefined)
  const [intro, setIntro] = useState<{ label: string; text: string } | null | undefined>(undefined)

  useEffect(() => { setMonth(date.getMonth()) }, [day]) // eslint-disable-line react-hooks/exhaustive-deps

  // Your year so far.
  useEffect(() => {
    if (!user) { setEntries(new Map()); return }
    fetchGuideYear(user.id, year)
      .then(rows => setEntries(new Map(rows.map(row => [row.day, row]))))
      .catch(caught => setLoadError(caught instanceof Error ? caught.message : 'We couldn’t load your progress.'))
  }, [user, year])

  useEffect(() => { setDraft(entries.get(day) ?? empty(year, day)); setSaved(false) }, [entries, day, year])

  // The verse of the day for this date, from the Free Use Bible API dataset.
  useEffect(() => {
    let live = true
    setVotd(undefined)
    verseOfTheDay(date).then(async reference => {
      if (!live) return
      if (!reference) { setVotd(null); return }
      setVotd(reference)
      const text = await fetchPassageText(reference).catch(() => '')
      if (live) setVotd({ ...reference, text })
    }).catch(() => live && setVotd(null))
    return () => { live = false }
  }, [day]) // eslint-disable-line react-hooks/exhaustive-deps

  // A study note to open the day: Tyndale's introduction to the New Testament reading.
  useEffect(() => {
    let live = true
    setIntro(undefined)
    const reading = plan.readings.find(item => item.track === 'nt') ?? plan.readings[0]
    fetchCommentary('tyndale', reading.book, reading.from).then(result => {
      if (!live) return
      const text = result.introduction || result.notes[0]?.text || (reading.from === 1 ? result.bookIntroduction : '')
      setIntro(text ? { label: readingLabel({ ...reading, to: reading.from }), text } : null)
    }).catch(() => live && setIntro(null))
    return () => { live = false }
  }, [day]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = useMemo(() => [...entries.values()].filter(entry => entry.completed_at).length, [entries])
  const currentStreak = useMemo(() => streak([...entries.values()], today), [entries, today])
  const allRead = plan.readings.every(reading => draft.readings.includes(readingKey(reading)))

  async function persist(next: GuideProgress) {
    if (!user) return
    setDraft(next)
    setEntries(current => new Map(current).set(next.day, next))
    setSaving(true); setSaved(false); setLoadError('')
    try {
      await saveGuideDay(user.id, next)
      setSaved(true)
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : 'We couldn’t save that.')
    } finally {
      setSaving(false)
    }
  }

  function toggleReading(reading: GuideReading) {
    if (!user) { navigate(`/auth?next=/guide/${day}`); return }
    const key = readingKey(reading)
    const readings = draft.readings.includes(key) ? draft.readings.filter(item => item !== key) : [...draft.readings, key]
    const complete = plan.readings.every(item => readings.includes(readingKey(item)))
    void persist({ ...draft, readings, completed_at: complete ? draft.completed_at ?? new Date().toISOString() : null })
  }

  const prompts = PROMPTS[date.getDay()]
  const longDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-4 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Daily Bible guide · {year}</p>
          <h1 className="font-heading text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">The whole Bible, <span className="text-primary">January to December.</span></h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">Three readings a day: the Old Testament, the New Testament, and Psalms with Proverbs. Read, reflect, pray and keep your streak.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-[420px]">
          <Stat value={`${done}`} label={`of ${GUIDE_DAYS} days`} />
          <Stat value={`${currentStreak}`} label="day streak" icon={<Fire className="h-4 w-4 text-primary" />} />
          <Stat value={`${Math.round((done / GUIDE_DAYS) * 100)}%`} label="of the Bible" />
        </div>
      </header>

      {!user && (
        <div className="mt-6 flex flex-col gap-3 rounded-[22px] border border-primary/25 bg-primary/[0.07] p-5 sm:flex-row sm:items-center">
          <Sunrise className="h-6 w-6 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-foreground/90">Sign in to tick off readings, keep a streak and journal your reflections.</p>
          <Link to={`/auth?next=/guide/${day}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Sign in <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
      {loadError && <div className="mt-6"><Notice tone="error">{loadError}</Notice></div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Calendar */}
        <aside className="h-fit rounded-[26px] border border-white/[0.07] bg-surface p-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setMonth(value => Math.max(0, value - 1))} disabled={month === 0} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <p className="font-heading text-lg font-semibold">{MONTHS[month]}</p>
            <button type="button" onClick={() => setMonth(value => Math.min(11, value + 1))} disabled={month === 11} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <MonthGrid year={year} month={month} selected={day} today={today} entries={entries} onPick={value => navigate(`/guide/${value}`)} />
          <div className="mt-4 grid grid-cols-6 gap-1.5">
            {MONTHS.map((name, index) => {
              const first = guideDayForDate(new Date(year, index, 1))
              const last = guideDayForDate(new Date(year, index + 1, 0))
              const finished = Array.from({ length: last - first + 1 }, (_, offset) => first + offset).filter(value => entries.get(value)?.completed_at).length
              const total = last - first + 1
              return (
                <button key={name} type="button" onClick={() => setMonth(index)} title={`${name}: ${finished} of ${total} days`} className={`relative h-8 overflow-hidden rounded-full border text-[10px] font-semibold uppercase tracking-wide transition-colors ${index === month ? 'border-primary/60 text-foreground' : 'border-white/[0.07] text-muted-foreground hover:text-foreground'}`}>
                  <span className="absolute inset-y-0 left-0 bg-primary/30" style={{ width: `${(finished / total) * 100}%` }} />
                  <span className="relative">{name.slice(0, 3)}</span>
                </button>
              )
            })}
          </div>
          {day !== today && <button type="button" onClick={() => navigate(`/guide/${today}`)} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/15"><Sunrise className="h-4 w-4" /> Go to today</button>}
        </aside>

        {/* The day */}
        <section aria-label={`Day ${day}`} className="min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Day {day}{day === today ? ' · Today' : ''}</p>
              <h2 className="mt-1 font-heading text-3xl font-semibold tracking-[-0.02em]">{longDate}</h2>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => navigate(`/guide/${day - 1}`)} disabled={day === 1} aria-label="Previous day" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.09] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => navigate(`/guide/${day + 1}`)} disabled={day === GUIDE_DAYS} aria-label="Next day" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.09] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Verse of the day */}
          <Link to={votd ? readerPath(votd) : '#'} className="bolt-card bolt-card--hover bolt-card--inset group relative block overflow-hidden rounded-[28px] border border-white/10">
            <img src="/assets/revival-dawn.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[75%_50%] transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
            <div className="relative p-7 sm:p-9">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><Sunrise className="h-4 w-4" /> Verse of the day{votd?.holiday ? ` · ${votd.holiday}` : ''}</p>
              {votd === undefined ? <div className="mt-5 space-y-3"><div className="h-5 w-4/5 animate-pulse rounded-full bg-white/10" /><div className="h-5 w-3/5 animate-pulse rounded-full bg-white/10" /></div>
                : votd ? (
                  <>
                    <blockquote className="mt-4 max-w-2xl font-scripture text-[1.35rem] leading-[1.6] text-white sm:text-[1.55rem]">“{votd.text || '…'}”</blockquote>
                    <p className="mt-4 flex items-center gap-2 font-heading text-sm font-semibold text-white/85">{formatReference(votd)} · BSB <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" /></p>
                  </>
                ) : <p className="mt-4 text-sm text-white/75">The verse of the day couldn’t load. Check your connection.</p>}
            </div>
          </Link>

          {/* Readings */}
          <div className="rounded-[26px] border border-white/[0.07] bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><BookOpen className="h-5 w-5 text-primary" /> Today’s readings</h3>
              <span className={`text-xs font-semibold ${allRead ? 'text-primary' : 'text-muted-foreground'}`}>{allRead ? 'Day complete' : `${plan.readings.filter(reading => draft.readings.includes(readingKey(reading))).length} of ${plan.readings.length} read`}</span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {plan.readings.map(reading => {
                const read = draft.readings.includes(readingKey(reading))
                return (
                  <li key={readingKey(reading)} className={`bolt-card flex items-center gap-3 rounded-[20px] border p-3 pl-4 transition-colors ${read ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                    <button type="button" role="checkbox" aria-checked={read} onClick={() => toggleReading(reading)} aria-label={`Mark ${readingLabel(reading)} as read`} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${read ? 'border-primary bg-primary text-primary-foreground' : 'border-white/20 hover:border-primary'}`}>
                      {read && <Check className="h-4 w-4" strokeWidth={2.4} />}
                    </button>
                    <span className="min-w-0 flex-1">
                      <small className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{TRACK_LABEL[reading.track]}</small>
                      <b className="block truncate font-heading text-[15px] font-semibold">{readingLabel(reading)}</b>
                    </span>
                    <Link to={readerPath({ book: reading.book, chapter: reading.from }, DEFAULT_TRANSLATION)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"><Bible className="h-4 w-4" /> Read</Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Study */}
          {intro !== null && (
            <div className="rounded-[26px] border border-white/[0.07] bg-surface-raised p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><Notebook className="h-5 w-5 text-primary" /> Before you read{intro ? ` · ${intro.label}` : ''}</h3>
              {intro === undefined ? <div className="mt-4 flex justify-center"><Loader className="h-5 w-5 animate-spin text-primary" /></div>
                : <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/85">{intro.text.length > 1100 ? `${intro.text.slice(0, 1100)}…` : intro.text}</p>}
              <p className="mt-3 text-[10px] text-muted-foreground/70">Tyndale Open Study Notes, via the Free Use Bible API.</p>
            </div>
          )}

          {/* Reflect and pray */}
          <div className="rounded-[26px] border border-white/[0.07] bg-surface p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><HandHeart className="h-5 w-5 text-primary" /> Reflect and pray</h3>
            <ul className="mt-3 space-y-1.5">{prompts.map(prompt => <li key={prompt} className="flex gap-2 text-sm text-foreground/85"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {prompt}</li>)}</ul>
            {user ? (
              <form onSubmit={event => { event.preventDefault(); void persist(draft) }} className="mt-5 space-y-3">
                <label className="block text-xs font-medium text-foreground/90">Your reflection
                  <textarea value={draft.reflection} onChange={event => { setDraft({ ...draft, reflection: event.target.value }); setSaved(false) }} maxLength={5000} rows={5} placeholder="What stood out to you today?" className="mt-2 w-full rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-sm leading-6 outline-none focus:border-primary/50" />
                </label>
                <label className="block text-xs font-medium text-foreground/90">Your prayer
                  <textarea value={draft.prayer} onChange={event => { setDraft({ ...draft, prayer: event.target.value }); setSaved(false) }} maxLength={2000} rows={3} placeholder="Talk to God about what you read." className="mt-2 w-full rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-sm leading-6 outline-none focus:border-primary/50" />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? <><Loader className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><Check className="h-4 w-4" /> Saved</> : 'Save journal'}</button>
                  <button type="button" onClick={() => navigate('/create/post', { state: { draft: { kind: 'word', title: `Day ${day}: ${plan.readings.map(readingLabel).join(', ')}`.slice(0, 140), body: draft.reflection, scripture: plan.readings.map(readingLabel)[0], tags: 'daily-guide' } } })} disabled={!draft.reflection.trim()} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-sm font-semibold disabled:opacity-40"><Share className="h-4 w-4 text-primary" /> Share to the feed</button>
                  <span className="text-[11px] text-muted-foreground">Your journal is private unless you share it.</span>
                </div>
              </form>
            ) : (
              <Link to={`/auth?next=/guide/${day}`} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-sm font-semibold">Sign in to journal <ArrowRight className="h-4 w-4 text-primary" /></Link>
            )}
          </div>
        </section>
      </div>

    </div>
  )
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-surface p-4">
      <p className="flex items-center gap-1.5 font-heading text-2xl font-semibold">{icon}{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function MonthGrid({ year, month, selected, today, entries, onPick }: { year: number; month: number; selected: number; today: number; entries: Map<number, GuideProgress>; onPick: (day: number) => void }) {
  const first = new Date(year, month, 1)
  const days = new Date(year, month + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7 // Monday first
  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: offset }, (_, index) => <span key={`pad-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const value = guideDayForDate(new Date(year, month, index + 1))
          const entry = entries.get(value)
          const done = Boolean(entry?.completed_at)
          const started = !done && Boolean(entry?.readings.length)
          const isSelected = value === selected && new Date(year, month, index + 1).getDate() === dateForGuideDay(selected, year).getDate()
          return (
            <button
              key={index}
              type="button"
              onClick={() => onPick(value)}
              aria-label={`${index + 1} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]}${done ? ', complete' : ''}`}
              aria-current={isSelected ? 'date' : undefined}
              className={`relative flex aspect-square items-center justify-center rounded-full font-heading text-[13px] font-semibold transition-colors ${done ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(255,92,138,0.35)]' : isSelected ? 'bg-white/[0.12] text-foreground' : 'text-foreground/75 hover:bg-white/[0.06]'} ${value === today ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
            >
              {index + 1}
              {started && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
