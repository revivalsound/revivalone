import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CloudUpload, GalleryAdd, Headphones, Loader, Plus, Trash } from '../../components/ui/icons'
import { Notice, inputClass } from '../../components/ui/kit'
import { useAuth } from '../../lib/AuthContext'
import { uploadMedia } from '../../lib/community'
import { audioDuration, clock, COURSE_CATEGORIES, createCourse } from '../../lib/academy'

type DraftEpisode = { key: string; title: string; summary: string; file: File | null; seconds: number }

const MAX_AUDIO = 50 * 1024 * 1024
const newEpisode = (): DraftEpisode => ({ key: Math.random().toString(36).slice(2), title: '', summary: '', file: null, seconds: 0 })

/** Teach a Rev Academy course: details, a cover, and audio episodes in order. */
export default function CreateCourse() {
  const navigate = useNavigate()
  const { user, displayName } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(COURSE_CATEGORIES[0])
  const [teacher, setTeacher] = useState(displayName)
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [episodes, setEpisodes] = useState<DraftEpisode[]>([newEpisode()])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const coverInput = useRef<HTMLInputElement>(null)
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => {
    if (!cover) { setCoverPreview(''); return }
    const url = URL.createObjectURL(cover)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [cover])

  const update = (key: string, patch: Partial<DraftEpisode>) => setEpisodes(current => current.map(item => (item.key === key ? { ...item, ...patch } : item)))

  async function pickAudio(key: string, file?: File | null) {
    if (!file) return
    if (!file.type.startsWith('audio/')) { setError('Episodes need to be audio files (MP3, M4A, WAV or OGG).'); return }
    if (file.size > MAX_AUDIO) { setError('Each episode can be up to 50 MB. Try exporting as MP3.'); return }
    setError('')
    const seconds = await audioDuration(file)
    update(key, { file, seconds, title: episodes.find(item => item.key === key)?.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (episodes.some(item => !item.file)) { setError('Add an audio file to every episode, or remove the empty ones.'); return }
    setError('')
    try {
      let coverUrl = ''
      if (cover) { setStatus('Uploading cover…'); coverUrl = (await uploadMedia(user.id, cover)).url }
      const uploaded = []
      for (const [index, item] of episodes.entries()) {
        setStatus(`Uploading episode ${index + 1} of ${episodes.length}…`)
        const { url } = await uploadMedia(user.id, item.file!)
        uploaded.push({ number: index + 1, title: item.title.trim(), summary: item.summary.trim(), audio_url: url, duration_seconds: item.seconds })
      }
      setStatus('Publishing…')
      const slug = await createCourse({ owner_id: user.id, title: title.trim(), category, description: description.trim(), teacher: teacher.trim(), cover_url: coverUrl }, uploaded)
      navigate(`/academy/${slug}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t publish the course.')
      setStatus('')
    }
  }

  const total = episodes.reduce((sum, item) => sum + item.seconds, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/academy" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Rev Academy</Link>
      <header className="mt-6 flex items-start gap-4">
        <span className="brand-ring brand-ring--on flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-plum text-primary"><Headphones className="h-6 w-6" /></span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Teach a course</p>
          <h1 className="mt-2 font-heading text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[2.6rem]">Teach what God <span className="text-primary">has taught you.</span></h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">Rev Academy courses are audio, episode by episode. Record each episode, add it here in order, and publish.</p>
        </div>
      </header>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <section className="rounded-[26px] border border-white/[0.07] bg-surface p-5 sm:p-7">
          <h2 className="font-heading text-lg font-semibold">About the course</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
            <button type="button" onClick={() => coverInput.current?.click()} className="relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] border border-dashed border-white/[0.14] bg-white/[0.02] text-xs text-muted-foreground hover:border-primary/40">
              {coverPreview ? <img src={coverPreview} alt="Course cover" className="absolute inset-0 h-full w-full object-cover" /> : <><GalleryAdd className="h-6 w-6 text-primary" /> Cover image</>}
            </button>
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file && file.size <= 8 * 1024 * 1024) setCover(file); event.target.value = '' }} />
            <div className="space-y-4">
              <label className="block text-xs font-medium text-foreground/90">Course title<input required minLength={3} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Built in the secret place" className={`${inputClass} mt-2 px-4`} /></label>
              <label className="block text-xs font-medium text-foreground/90">Taught by<input required minLength={2} maxLength={80} value={teacher} onChange={event => setTeacher(event.target.value)} className={`${inputClass} mt-2 px-4`} /></label>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-foreground/90">Category</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{COURSE_CATEGORIES.map(name => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)} className={`h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors ${category === name ? 'border-primary/60 bg-primary/[0.14]' : 'border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:text-foreground'}`}>{name}</button>)}</div>
          </div>
          <label className="mt-4 block text-xs font-medium text-foreground/90">What the course covers<textarea required minLength={10} maxLength={2000} rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Who it’s for and what listeners will take away." className={`${inputClass} mt-2 h-auto px-4 py-3 leading-6`} /></label>
        </section>

        <section className="rounded-[26px] border border-white/[0.07] bg-surface p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Episodes</h2>
            <span className="text-xs text-muted-foreground">{episodes.length} episode{episodes.length > 1 ? 's' : ''}{total ? ` · ${clock(total)}` : ''}</span>
          </div>
          <ol className="mt-5 space-y-3">
            {episodes.map((item, index) => (
              <li key={item.key} className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground">{index + 1}</span>
                  <input required maxLength={140} value={item.title} onChange={event => update(item.key, { title: event.target.value })} placeholder={`Episode ${index + 1} title`} className={`${inputClass} h-11 flex-1 px-4`} />
                  {episodes.length > 1 && <button type="button" onClick={() => setEpisodes(current => current.filter(entry => entry.key !== item.key))} aria-label="Remove episode" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-300"><Trash className="h-4 w-4" /></button>}
                </div>
                <textarea maxLength={1000} rows={2} value={item.summary} onChange={event => update(item.key, { summary: event.target.value })} placeholder="A sentence on what this episode covers (optional)" className={`${inputClass} mt-3 h-auto px-4 py-3`} />
                <label className={`mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm transition-colors ${item.file ? 'border-primary/40 bg-primary/[0.06]' : 'border-white/[0.14] hover:border-primary/40'}`}>
                  <CloudUpload className="h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{item.file ? item.file.name : 'Choose the audio file (MP3, M4A, WAV)'}</span>
                  {item.seconds > 0 && <span className="font-mono text-xs text-muted-foreground">{clock(item.seconds)}</span>}
                  <input type="file" accept="audio/*" className="sr-only" onChange={event => { void pickAudio(item.key, event.target.files?.[0]); event.target.value = '' }} />
                </label>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setEpisodes(current => [...current, newEpisode()])} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-sm font-semibold hover:bg-white/[0.05]"><Plus className="h-4 w-4 text-primary" /> Add an episode</button>
        </section>

        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={Boolean(status)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.28)] disabled:opacity-60">
          {status ? <><Loader className="h-4 w-4 animate-spin" /> {status}</> : <>Publish course <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </div>
  )
}
