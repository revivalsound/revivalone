import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Eye, Fire, Loader, Users } from '../../components/ui/icons'
import { Notice, inputClass } from '../../components/ui/kit'
import MediaPicker from '../../components/community/MediaPicker'
import { CellCard, EventCard } from '../../components/community/cards'
import { useAuth } from '../../lib/AuthContext'
import { createInitiative, uploadMedia, type Format, type Initiative, type InitiativeKind } from '../../lib/community'

const EVENT_CATEGORIES = ['Worship night', 'Prayer gathering', 'Conference', 'Outreach', 'Tent meeting', 'Bible study', 'Youth night']
const TRACKS = ['Evangelism', 'Prayer', 'Leadership', 'Discipleship', 'Worship', 'Missions']
const FOCUSES = ['Prayer & Scripture', 'Young professionals', 'Students & campus', 'Families', 'Outreach', 'Men', 'Women']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type Values = {
  title: string; description: string; city: string; date: string
  category: string; format: Format; venue: string; online_link: string; start_time: string; end_time: string; capacity: string
  track: string; weeks: string; days: string[]; outcomes: [string, string, string]
  focus: string; area: string; meeting_day: string; max_members: string
}

const PAGES: Record<InitiativeKind, { eyebrow: string; title: ReactNode; lede: string; icon: typeof Fire; submit: string }> = {
  event: { eyebrow: 'Create an event', title: <>Gather people <span className="text-primary">in one place.</span></>, lede: 'A worship night, prayer gathering, outreach or conference. Add a cover so it stands out in the directory.', icon: CalendarDays, submit: 'Publish event' },
  bootcamp: { eyebrow: 'Create a gospel bootcamp', title: <>Train a team <span className="text-primary">for the harvest.</span></>, lede: 'An intensive track over a few weeks: evangelism, prayer, leadership or discipleship.', icon: Fire, submit: 'Publish bootcamp' },
  cell: { eyebrow: 'Start a revival cell', title: <>Give faith <span className="text-primary">an address.</span></>, lede: 'A small group that meets, grows and serves together. You’ll lead it, and its group chat opens straight away.', icon: Users, submit: 'Start the cell' },
}

function nextWeek() {
  const date = new Date(Date.now() + 7 * 86_400_000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const EMPTY: Values = {
  title: '', description: '', city: '', date: nextWeek(),
  category: EVENT_CATEGORIES[0], format: 'in_person', venue: '', online_link: '', start_time: '18:00', end_time: '20:00', capacity: '',
  track: TRACKS[0], weeks: '4', days: ['Saturday'], outcomes: ['', '', ''],
  focus: FOCUSES[0], area: '', meeting_day: 'Thursday', max_members: '',
}

export default function CreatePage() {
  const { kind = '' } = useParams()
  if (kind !== 'event' && kind !== 'bootcamp' && kind !== 'cell') return <Navigate to="/home" replace />
  return <CreateForm key={kind} kind={kind} />
}

function CreateForm({ kind }: { kind: InitiativeKind }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const page = PAGES[kind]
  const [values, setValues] = useState<Values>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState<'' | 'uploading' | 'saving'>('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues(current => ({ ...current, [key]: value }))
  const online = values.format === 'online'
  const number = (value: string) => (value.trim() ? Math.max(1, Math.round(Number(value))) : null)

  function details(): Initiative['details'] {
    if (kind === 'event') return { category: values.category, format: values.format, venue: online ? '' : values.venue.trim(), online_link: online || values.format === 'hybrid' ? values.online_link.trim() : '', start_time: values.start_time, end_time: values.end_time, capacity: number(values.capacity) }
    if (kind === 'bootcamp') return { track: values.track, format: values.format, venue: online ? '' : values.venue.trim(), weeks: Number(values.weeks), days: values.days, start_time: values.start_time, capacity: number(values.capacity), outcomes: values.outcomes.map(item => item.trim()).filter(Boolean) }
    return { focus: values.focus, area: online ? '' : values.area.trim(), format: values.format, meeting_day: values.meeting_day, start_time: values.start_time, max_members: number(values.max_members) }
  }

  const draft = {
    id: 'preview', owner_id: user?.id ?? '', kind, status: 'published', created_at: new Date().toISOString(),
    title: values.title || (kind === 'cell' ? 'Your cell name' : kind === 'bootcamp' ? 'Your bootcamp' : 'Your event'),
    description: values.description || 'Your description will appear here.',
    city: online ? 'Online' : values.city || 'Your city',
    starts_at: values.date,
    media_url: preview, media_type: file ? (file.type.startsWith('video/') ? 'video' : 'image') : '',
    details: details(), member_count: 1,
  } as Initiative

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (kind === 'bootcamp' && values.days.length === 0) { setError('Choose at least one day the bootcamp meets.'); return }
    if ((kind === 'event') && values.end_time && values.end_time <= values.start_time) { setError('The end time needs to be after the start time.'); return }
    setError('')
    try {
      let media = { url: '', type: '' as '' | 'image' | 'video' }
      if (file) { setSaving('uploading'); media = await uploadMedia(user.id, file) }
      setSaving('saving')
      const created = await createInitiative({
        owner_id: user.id, kind, title: values.title.trim(), description: values.description.trim(),
        city: online ? 'Online' : values.city.trim(), starts_at: values.date,
        media_url: media.url, media_type: media.type, details: details(),
      })
      navigate(kind === 'cell' ? `/community/cells/${created.id}` : '/events', { state: { created: created.id } })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t publish this. Try again.')
      setSaving('')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to={kind === 'cell' ? '/community/cells' : '/events'} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <header className="mt-6 flex items-start gap-4">
        <span className="brand-ring brand-ring--on flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1a0610] text-primary"><page.icon className="h-6 w-6" /></span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{page.eyebrow}</p>
          <h1 className="mt-2 font-heading text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[2.6rem]">{page.title}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">{page.lede}</p>
        </div>
      </header>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Panel step="1" title="Cover">
            <MediaPicker file={file} onChange={setFile} label={kind === 'cell' ? 'A photo or short video of your group or neighbourhood' : 'Cover image or promo video'} />
          </Panel>

          <Panel step="2" title="The basics">
            <Field label={kind === 'cell' ? 'Cell name' : kind === 'bootcamp' ? 'Bootcamp name' : 'Event name'}>
              <input required minLength={3} maxLength={120} value={values.title} onChange={event => set('title', event.target.value)} placeholder={kind === 'cell' ? 'Yaba Central Cell' : kind === 'bootcamp' ? 'Light Up Abuja' : 'The Upper Room'} className={`${inputClass} px-4`} />
            </Field>
            {kind === 'event' && <Chips label="Type of event" options={EVENT_CATEGORIES} value={values.category} onChange={value => set('category', value)} />}
            {kind === 'bootcamp' && <Chips label="Track" options={TRACKS} value={values.track} onChange={value => set('track', value)} />}
            {kind === 'cell' && <Chips label="Focus" options={FOCUSES} value={values.focus} onChange={value => set('focus', value)} />}
            <Field label={kind === 'cell' ? 'About the cell' : 'Description'}>
              <textarea required minLength={10} maxLength={4000} rows={5} value={values.description} onChange={event => set('description', event.target.value)} placeholder={kind === 'cell' ? 'Who is it for, what happens when you meet, and what to expect the first time.' : kind === 'bootcamp' ? 'What the bootcamp covers, who it’s for and what’s expected of people who sign up.' : 'What will happen, who it’s for and anything people should bring.'} className={`${inputClass} h-auto px-4 py-3 leading-6`} />
            </Field>
            {kind === 'bootcamp' && (
              <div>
                <p className="text-xs font-medium text-foreground/90">What people will be able to do afterwards</p>
                <div className="mt-2 space-y-2">
                  {values.outcomes.map((outcome, index) => (
                    <input key={index} maxLength={120} value={outcome} onChange={event => { const next = [...values.outcomes] as Values['outcomes']; next[index] = event.target.value; set('outcomes', next) }} placeholder={['Share their testimony in two minutes', 'Lead someone in prayer', 'Follow up new believers'][index]} className={`${inputClass} px-4`} />
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel step="3" title={kind === 'cell' ? 'When you meet' : 'When'}>
            {kind === 'cell' ? (
              <>
                <Chips label="Meeting day" options={DAYS} value={values.meeting_day} onChange={value => set('meeting_day', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Time"><input required type="time" value={values.start_time} onChange={event => set('start_time', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
                  <Field label="First meeting"><input required type="date" value={values.date} onChange={event => set('date', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
                </div>
              </>
            ) : kind === 'bootcamp' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Starts"><input required type="date" value={values.date} onChange={event => set('date', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
                  <Field label="Length">
                    <select value={values.weeks} onChange={event => set('weeks', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`}>
                      {[1, 2, 3, 4, 6, 8, 10, 12].map(weeks => <option key={weeks} value={weeks}>{weeks} week{weeks > 1 ? 's' : ''}</option>)}
                    </select>
                  </Field>
                  <Field label="Session time"><input required type="time" value={values.start_time} onChange={event => set('start_time', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground/90">Meets on</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DAYS.map(day => {
                      const on = values.days.includes(day)
                      return <button key={day} type="button" aria-pressed={on} onClick={() => set('days', on ? values.days.filter(item => item !== day) : [...values.days, day])} className={`h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:text-foreground'}`}>{day.slice(0, 3)}</button>
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date"><input required type="date" value={values.date} onChange={event => set('date', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
                <Field label="Starts"><input required type="time" value={values.start_time} onChange={event => set('start_time', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
                <Field label="Ends"><input type="time" value={values.end_time} onChange={event => set('end_time', event.target.value)} className={`${inputClass} px-4 [color-scheme:dark]`} /></Field>
              </div>
            )}
          </Panel>

          <Panel step="4" title="Where">
            <Chips label="Format" options={kind === 'cell' ? ['in_person', 'online'] : ['in_person', 'online', 'hybrid']} labels={{ in_person: 'In person', online: 'Online', hybrid: 'Hybrid' }} value={values.format} onChange={value => set('format', value as Format)} />
            {!online && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={kind === 'cell' ? 'Neighbourhood or area' : 'Venue'}>
                  <input required maxLength={120} value={kind === 'cell' ? values.area : values.venue} onChange={event => set(kind === 'cell' ? 'area' : 'venue', event.target.value)} placeholder={kind === 'cell' ? 'Yaba' : 'The Civic Centre'} className={`${inputClass} px-4`} />
                </Field>
                <Field label="City"><input required minLength={2} maxLength={80} value={values.city} onChange={event => set('city', event.target.value)} placeholder="Lagos" className={`${inputClass} px-4`} /></Field>
              </div>
            )}
            {kind !== 'cell' && values.format !== 'in_person' && (
              <Field label="Online link" hint="optional, shared with people who sign up">
                <input type="url" maxLength={500} value={values.online_link} onChange={event => set('online_link', event.target.value)} placeholder="https://" className={`${inputClass} px-4`} />
              </Field>
            )}
            <Field label={kind === 'cell' ? 'Maximum members' : 'Capacity'} hint="optional">
              <input type="number" min={1} max={100000} value={kind === 'cell' ? values.max_members : values.capacity} onChange={event => set(kind === 'cell' ? 'max_members' : 'capacity', event.target.value)} placeholder={kind === 'cell' ? '20' : '500'} className={`${inputClass} px-4`} />
            </Field>
          </Panel>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Eye className="h-4 w-4 text-primary" /> Live preview</p>
          <div className="pointer-events-none" aria-hidden>
            {kind === 'cell' ? <CellCard cell={draft as Initiative<'cell'>} /> : <EventCard initiative={draft as Initiative<'event' | 'bootcamp'>} going={false} onToggleGoing={() => undefined} />}
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" disabled={Boolean(saving)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.28)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
            {saving ? <><Loader className="h-4 w-4 animate-spin" /> {saving === 'uploading' ? 'Uploading media…' : 'Publishing…'}</> : <>{page.submit} <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">{kind === 'cell' ? 'Your cell appears in Revival cells and you become its leader.' : 'It appears in the Events directory straight away.'}</p>
        </aside>
      </form>
    </div>
  )
}

function Panel({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[26px] border border-white/[0.07] bg-surface p-5 sm:p-7">
      <h2 className="flex items-center gap-3 font-heading text-lg font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{step}</span> {title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-foreground/90">
      {label}{hint && <span className="text-muted-foreground"> ({hint})</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

function Chips({ label, options, labels, value, onChange }: { label: string; options: string[]; labels?: Record<string, string>; value: string; onChange: (value: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="text-xs font-medium text-foreground/90">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map(option => (
          <button key={option} type="button" role="radio" aria-checked={value === option} onClick={() => onChange(option)} className={`h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors ${value === option ? 'border-primary/60 bg-primary/[0.14] text-foreground' : 'border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:text-foreground'}`}>{labels?.[option] ?? option}</button>
        ))}
      </div>
    </div>
  )
}
