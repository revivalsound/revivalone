import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bible, Check, ChevronDown, Copy, Headphones, Notebook, PauseCircle, Pen, Play, Settings, Share, Trash, X,
} from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import ChapterText from '../../components/bible/ChapterText'
import BookPicker from '../../components/bible/BookPicker'
import StudyPanel from '../../components/bible/StudyPanel'
import PostComposer from '../../components/posts/PostComposer'
import { useAuth } from '../../lib/AuthContext'
import {
  bookById, bookSlug, DEFAULT_TRANSLATION, fetchChapter, findBook, formatReference, translationById, TRANSLATIONS, verseText,
  type ChapterContent,
} from '../../lib/bible'
import {
  fetchHighlights, HIGHLIGHT_COLORS, readLast, readPrefs, ReadingNotReady, removeHighlights, saveHighlights, writeLast, writePrefs,
  type Highlight, type HighlightColor, type ReaderPrefs,
} from '../../lib/reading'

type Chapter = Awaited<ReturnType<typeof fetchChapter>>
type Footnote = { noteId: number; text: string; caller?: string | null }

/** /bible: open where the reader left off, or John 1. */
export function BibleHome() {
  const last = readLast()
  const book = bookById(last?.book ?? 'JHN') ?? bookById('JHN')!
  return <Navigate to={`/bible/${last?.translation ?? DEFAULT_TRANSLATION}/${bookSlug(book)}/${last?.chapter ?? 1}`} replace />
}

const NARRATORS: Record<string, string> = { souer: 'Bob Souer', hays: 'Barry Hays', david: 'David Campbell' }

export default function BibleReader() {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const book = findBook(params.book ?? '') ?? bookById(params.book ?? '')
  const chapterNumber = Math.max(1, Number(params.chapter) || 1)
  const translation = translationById(params.translation ?? '') ? params.translation! : DEFAULT_TRANSLATION

  const [data, setData] = useState<Chapter | null>(null)
  const [error, setError] = useState('')
  const [prefs, setPrefs] = useState<ReaderPrefs>(readPrefs)
  const [highlights, setHighlights] = useState<Map<number, Highlight>>(new Map())
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [flash, setFlash] = useState<number | null>(null)
  const [footnote, setFootnote] = useState<Footnote | null>(null)
  const [picking, setPicking] = useState(false)
  const [settings, setSettings] = useState(false)
  const [translationsOpen, setTranslationsOpen] = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audio = useRef<HTMLAudioElement>(null)
  const autoplay = useRef(Boolean((location.state as { autoplay?: boolean } | null)?.autoplay))

  const updatePrefs = (next: Partial<ReaderPrefs>) => setPrefs(current => { const value = { ...current, ...next }; writePrefs(value); return value })

  // Load the chapter.
  useEffect(() => {
    if (!book) return
    let live = true
    setData(null); setError(''); setSelected(new Set()); setFootnote(null)
    fetchChapter(translation, book.id, chapterNumber)
      .then(result => {
        if (!live) return
        setData(result)
        writeLast({ translation, book: book.id, chapter: chapterNumber })
      })
      .catch(caught => live && setError(caught instanceof Error && caught.message === 'not-found' ? `${translationById(translation)?.short ?? translation} doesn’t include ${book.name} ${chapterNumber}.` : 'We couldn’t load this chapter. Check your connection and try again.'))
    return () => { live = false }
  }, [translation, book, chapterNumber])

  // Your highlights and notes for this chapter.
  useEffect(() => {
    if (!user || !book) { setHighlights(new Map()); return }
    let live = true
    fetchHighlights(user.id, book.id, chapterNumber)
      .then(rows => live && setHighlights(new Map(rows.map(row => [row.verse, row]))))
      .catch(caught => live && caught instanceof ReadingNotReady && setSaveError(caught.message))
    return () => { live = false }
  }, [user, book, chapterNumber])

  // Jump to #v16 links, with a short glow on the verse.
  useEffect(() => {
    if (!data) return
    const verse = Number(location.hash.replace('#v', ''))
    if (verse) {
      requestAnimationFrame(() => document.getElementById(`v${verse}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      setFlash(verse)
      const timer = window.setTimeout(() => setFlash(null), 2200)
      return () => window.clearTimeout(timer)
    }
    window.scrollTo(0, 0)
  }, [data, location.hash])

  const audioUrl = data?.thisChapterAudioLinks?.[prefs.narrator] ?? Object.values(data?.thisChapterAudioLinks ?? {})[0]

  // Keep playing into the next chapter when narration was on.
  useEffect(() => {
    if (!audioUrl || !audio.current || !autoplay.current) return
    autoplay.current = false
    void audio.current.play().catch(() => undefined)
  }, [audioUrl])

  const go = useCallback((target: { book: string; chapter: number } | null | undefined, options: { autoplay?: boolean } = {}) => {
    if (!target) return
    const next = bookById(target.book)
    if (next) navigate(`/bible/${translation}/${bookSlug(next)}/${target.chapter}`, { state: options })
  }, [navigate, translation])

  // Arrow keys move between chapters.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
      if (event.key === 'ArrowRight') go(data?.nextChapterReference)
      if (event.key === 'ArrowLeft') go(data?.previousChapterReference)
      if (event.key === 'Escape') setSelected(new Set())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, go])

  const verses = useMemo(() => (data?.chapter.content ?? []).filter((item): item is ChapterContent & { type: 'verse' } => item.type === 'verse'), [data])
  const selectedList = [...selected].sort((a, b) => a - b)
  const contiguous = selectedList.every((verse, index) => index === 0 || verse === selectedList[index - 1] + 1)
  const selectionLabel = book && selectedList.length
    ? contiguous ? formatReference({ book: book.id, chapter: chapterNumber, verse: selectedList[0], endVerse: selectedList.at(-1) }) : `${book.name} ${chapterNumber}:${selectedList.join(', ')}`
    : ''
  const selectionText = selectedList.map(number => verseText(verses.find(verse => verse.number === number)?.content ?? [])).join(' ')

  if (!book) return <Navigate to="/bible" replace />

  const toggleVerse = (verse: number) => setSelected(current => {
    const next = new Set(current)
    if (next.has(verse)) next.delete(verse)
    else next.add(verse)
    return next
  })

  function needAccount() {
    navigate(`/auth?next=${encodeURIComponent(location.pathname)}`)
  }

  async function highlight(color: HighlightColor | 'none') {
    if (!user) { needAccount(); return }
    setSaveError('')
    const previous = new Map(highlights)
    const next = new Map(highlights)
    const rows: Highlight[] = []
    const cleared: number[] = []
    for (const verse of selectedList) {
      const note = next.get(verse)?.note ?? ''
      if (color === 'none' && !note) { next.delete(verse); cleared.push(verse) }
      else { const row = { book: book!.id, chapter: chapterNumber, verse, color, note }; next.set(verse, row); rows.push(row) }
    }
    setHighlights(next)
    setSelected(new Set())
    try {
      if (rows.length) await saveHighlights(user.id, rows)
      if (cleared.length) await removeHighlights(user.id, book!.id, chapterNumber, cleared)
    } catch (caught) {
      setHighlights(previous)
      setSaveError(caught instanceof Error ? caught.message : 'We couldn’t save that.')
    }
  }

  async function saveNote(note: string) {
    if (!user) return
    const verse = selectedList[0]
    const existing = highlights.get(verse)
    const row: Highlight = { book: book!.id, chapter: chapterNumber, verse, color: existing?.color ?? 'none', note: note.trim() }
    setHighlights(current => new Map(current).set(verse, row))
    setNoteOpen(false)
    setSelected(new Set())
    try {
      if (!row.note && row.color === 'none') await removeHighlights(user.id, book!.id, chapterNumber, [verse])
      else await saveHighlights(user.id, [row])
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'We couldn’t save your note.')
    }
  }

  function copy() {
    void navigator.clipboard.writeText(`“${selectionText}” ${selectionLabel} (${translationById(translation)?.short})`).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  function toggleAudio() {
    const element = audio.current
    if (!element) return
    if (element.paused) void element.play()
    else element.pause()
  }

  const current = translationById(translation)!
  const focusVerse = selectedList.length === 1 ? selectedList[0] : null

  return (
    <div className="mx-auto max-w-6xl px-4 pb-40 pt-6 sm:px-6 lg:pb-28">
      {audioUrl && (
        <audio
          ref={audio}
          src={audioUrl}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={event => setProgress(event.currentTarget.duration ? event.currentTarget.currentTime / event.currentTarget.duration : 0)}
          onEnded={() => { setPlaying(false); go(data?.nextChapterReference, { autoplay: true }) }}
        />
      )}

      {/* Reader toolbar */}
      <div className="sticky top-14 z-20 -mx-4 flex items-center gap-2 border-b border-white/[0.06] bg-background/85 px-4 py-2.5 backdrop-blur-xl sm:mx-0 sm:rounded-full sm:border sm:px-2">
        <button type="button" onClick={() => setPicking(true)} className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full bg-white/[0.05] pl-3 pr-3.5 font-heading text-[14px] font-semibold transition-colors hover:bg-white/[0.09]">
          <Bible className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{book.name} {chapterNumber}</span> <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
        <div className="relative">
          <button type="button" onClick={() => setTranslationsOpen(value => !value)} aria-expanded={translationsOpen} className="inline-flex h-10 items-center gap-1 rounded-full bg-white/[0.05] px-3.5 font-heading text-[13px] font-semibold transition-colors hover:bg-white/[0.09]">
            {current.short} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {translationsOpen && (
            <div className="dialog-in absolute left-0 top-12 z-30 w-[min(86vw,340px)] overflow-hidden rounded-[22px] border border-white/[0.1] glass glass-strong p-2 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              {TRANSLATIONS.map(item => (
                <button key={item.id} type="button" onClick={() => { setTranslationsOpen(false); navigate(`/bible/${item.id}/${bookSlug(book)}/${chapterNumber}${location.hash}`) }} className={`flex w-full items-start gap-3 rounded-[14px] p-3 text-left transition-colors ${item.id === translation ? 'bg-primary/10' : 'hover:bg-white/[0.05]'}`}>
                  <span className="w-11 shrink-0 font-heading text-[13px] font-semibold text-primary">{item.short}</span>
                  <span className="min-w-0"><b className="block text-[13px] font-semibold">{item.name}</b><small className="text-[11px] text-muted-foreground">{item.about}</small></span>
                  {item.id === translation && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {audioUrl && (
            <button type="button" onClick={toggleAudio} aria-label={playing ? 'Pause narration' : 'Listen to this chapter'} className={`inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${playing ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] hover:bg-white/[0.09]'}`}>
              {playing ? <PauseCircle className="h-4 w-4" /> : <Headphones className="h-4 w-4 text-primary" />}<span className="hidden sm:inline">{playing ? 'Pause' : 'Listen'}</span>
            </button>
          )}
          <button type="button" onClick={() => setStudyOpen(true)} aria-label="Study notes" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.09] lg:hidden"><Notebook className="h-4 w-4 text-primary" /></button>
          <div className="relative">
            <button type="button" onClick={() => setSettings(value => !value)} aria-label="Reading settings" aria-expanded={settings} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.09]"><Settings className="h-4 w-4" /></button>
            {settings && (
              <div className="dialog-in absolute right-0 top-12 z-30 w-64 space-y-4 rounded-[22px] border border-white/[0.1] glass glass-strong p-4 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">Text size</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => updatePrefs({ size: Math.max(15, prefs.size - 1) })} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] font-scripture text-sm">A</button>
                    <input type="range" min={15} max={26} value={prefs.size} onChange={event => updatePrefs({ size: Number(event.target.value) })} aria-label="Text size" className="episode-seek h-1.5 flex-1 appearance-none rounded-full bg-white/10" />
                    <button type="button" onClick={() => updatePrefs({ size: Math.min(26, prefs.size + 1) })} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] font-scripture text-lg">A</button>
                  </div>
                </div>
                <Toggle label="Words of Jesus in pink" on={prefs.redLetters} onChange={value => updatePrefs({ redLetters: value })} />
                <Toggle label="Verse numbers" on={prefs.verseNumbers} onChange={value => updatePrefs({ verseNumbers: value })} />
                {data && Object.keys(data.thisChapterAudioLinks ?? {}).length > 1 && (
                  <label className="block text-[11px] font-semibold text-muted-foreground">Narrator
                    <select value={prefs.narrator} onChange={event => updatePrefs({ narrator: event.target.value })} className="mt-2 h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.03] px-3 text-xs font-semibold text-foreground outline-none [color-scheme:dark]">
                      {Object.keys(data.thisChapterAudioLinks ?? {}).map(id => <option key={id} value={id}>{NARRATORS[id] ?? id}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {playing && <div className="sticky top-[7.6rem] z-10 h-0.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress * 100}%` }} /></div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="mx-auto w-full max-w-[44rem]">
          <header className="mb-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{book.testament === 'OT' ? 'Old Testament' : 'New Testament'} · {current.name}</p>
            <h1 className="mt-3 font-heading text-[2.6rem] font-semibold leading-none tracking-[-0.03em] sm:text-[3.4rem]">{book.name} <span className="text-primary">{chapterNumber}</span></h1>
          </header>

          {saveError && <div className="mb-5"><Notice tone="error">{saveError}</Notice></div>}
          {error ? (
            <div className="rounded-[24px] border border-white/[0.08] bg-surface p-8 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button type="button" onClick={() => navigate(`/bible/${DEFAULT_TRANSLATION}/${bookSlug(book)}/${chapterNumber}`)} className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Read in BSB</button>
            </div>
          ) : !data ? (
            <div className="space-y-4" aria-busy>{Array.from({ length: 9 }, (_, index) => <div key={index} className="h-4 animate-pulse rounded-full bg-white/[0.06]" style={{ width: `${70 + ((index * 37) % 30)}%` }} />)}</div>
          ) : (
            <ChapterText
              content={data.chapter.content}
              footnotes={data.chapter.footnotes ?? []}
              highlights={highlights}
              selected={selected}
              flash={flash}
              redLetters={prefs.redLetters}
              verseNumbers={prefs.verseNumbers}
              size={prefs.size}
              onVerse={toggleVerse}
              onFootnote={setFootnote}
            />
          )}

          {data && (
            <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-6" aria-label="Chapters">
              {data.previousChapterReference ? (
                <button type="button" onClick={() => go(data.previousChapterReference)} className="group flex items-center gap-3 rounded-[20px] border border-white/[0.07] bg-surface p-4 text-left transition-colors hover:border-primary/30">
                  <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-0.5" />
                  <span className="min-w-0"><small className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Previous</small><b className="block truncate font-heading text-sm">{formatReference(data.previousChapterReference)}</b></span>
                </button>
              ) : <span />}
              {data.nextChapterReference && (
                <button type="button" onClick={() => go(data.nextChapterReference)} className="group flex items-center justify-end gap-3 rounded-[20px] border border-white/[0.07] bg-surface p-4 text-right transition-colors hover:border-primary/30">
                  <span className="min-w-0"><small className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Next</small><b className="block truncate font-heading text-sm">{formatReference(data.nextChapterReference)}</b></span>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </nav>
          )}
          <p className="mt-8 text-center text-[11px] text-muted-foreground/70">{current.name}{translation === 'BSB' ? ' · public domain' : ''} · from the Free Use Bible API</p>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-32 h-[calc(100dvh-10rem)] rounded-[26px] border border-white/[0.07] bg-surface-raised/70 p-4">
            <StudyPanel translation={translation} book={book.id} chapter={chapterNumber} focusVerse={focusVerse} highlights={[...highlights.values()]} onJump={verse => navigate({ hash: `v${verse}` })} />
          </div>
        </aside>
      </div>

      {/* Selected verses */}
      {selectedList.length > 0 && (
        <div className="dialog-in fixed inset-x-3 bottom-24 z-30 mx-auto max-w-2xl rounded-[24px] border border-white/[0.1] glass glass-strong p-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] lg:bottom-6">
          <div className="flex items-center gap-2 px-1">
            <p className="min-w-0 flex-1 truncate font-heading text-sm font-semibold">{selectionLabel}</p>
            <button type="button" onClick={() => setSelected(new Set())} aria-label="Clear selection" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] p-1.5">
              {HIGHLIGHT_COLORS.map(color => (
                <button key={color.id} type="button" onClick={() => void highlight(color.id)} aria-label={`Highlight ${color.label}`} className="h-7 w-7 rounded-full ring-2 ring-transparent transition-transform hover:scale-110 hover:ring-white/40" style={{ background: color.swatch }} />
              ))}
              {selectedList.some(verse => highlights.get(verse)?.color && highlights.get(verse)?.color !== 'none') && (
                <button type="button" onClick={() => void highlight('none')} aria-label="Remove highlight" className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-muted-foreground hover:text-foreground"><Trash className="h-3.5 w-3.5" /></button>
              )}
            </div>
            {selectedList.length === 1 && <ActionButton onClick={() => (user ? setNoteOpen(true) : needAccount())} icon={<Pen className="h-4 w-4" />}>{highlights.get(selectedList[0])?.note ? 'Edit note' : 'Note'}</ActionButton>}
            <ActionButton onClick={copy} icon={copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}>{copied ? 'Copied' : 'Copy'}</ActionButton>
            <ActionButton onClick={() => setSharing(true)} icon={<Share className="h-4 w-4" />}>Post</ActionButton>
            <ActionButton className="lg:hidden" onClick={() => setStudyOpen(true)} icon={<Notebook className="h-4 w-4" />}>Study</ActionButton>
          </div>
        </div>
      )}

      {footnote && (
        <div className="dialog-in fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-[22px] border border-white/[0.1] glass glass-strong p-4 shadow-[0_24px_60px_rgba(0,0,0,0.55)] lg:bottom-6">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-[11px] font-bold text-primary">*</span>
            <p className="flex-1 text-sm leading-6 text-foreground/90">{footnote.text}</p>
            <button type="button" onClick={() => setFootnote(null)} aria-label="Close footnote" className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {studyOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setStudyOpen(false)}>
          <div className="dialog-in h-[78dvh] w-full rounded-t-[28px] border-t border-white/[0.08] bg-[#0f0b0c] p-4" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><p className="font-heading text-lg font-semibold">Study {book.name} {chapterNumber}</p><button type="button" onClick={() => setStudyOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08]"><X className="h-4 w-4" /></button></div>
            <div className="h-[calc(100%-3rem)]"><StudyPanel translation={translation} book={book.id} chapter={chapterNumber} focusVerse={focusVerse} highlights={[...highlights.values()]} onJump={verse => { setStudyOpen(false); navigate({ hash: `v${verse}` }) }} /></div>
          </div>
        </div>
      )}

      {picking && <BookPicker current={book} chapter={chapterNumber} onPick={(next, chapter) => navigate(`/bible/${translation}/${bookSlug(next)}/${chapter}`)} onClose={() => setPicking(false)} />}
      {noteOpen && <NoteDialog label={selectionLabel} text={selectionText} initial={highlights.get(selectedList[0])?.note ?? ''} onSave={saveNote} onClose={() => setNoteOpen(false)} />}
      {sharing && (
        <PostComposer
          initial={{ kind: 'word', scripture: selectionLabel, body: `“${selectionText}” (${selectionLabel}, ${current.short})\n\n`, tags: 'scripture' }}
          onClose={() => setSharing(false)}
          onPosted={post => navigate(`/post/${post.id}`)}
        />
      )}
      {/* Play control for phones, above the bottom navigation */}
      {audioUrl && playing && selectedList.length === 0 && (
        <button type="button" onClick={toggleAudio} className="fixed bottom-24 right-4 z-30 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,92,138,0.4)] lg:hidden"><PauseCircle className="h-5 w-5" /> Pause</button>
      )}
      {audioUrl && !playing && progress > 0 && progress < 1 && selectedList.length === 0 && (
        <button type="button" onClick={toggleAudio} className="fixed bottom-24 right-4 z-30 flex h-12 items-center gap-2 rounded-full border border-white/[0.12] glass glass-strong px-4 text-sm font-semibold lg:bottom-6"><Play className="h-4 w-4 text-primary" /> Resume</button>
      )}
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between text-[12px] font-medium">
      {label}
      <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-white/15'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-1'}`} /></span>
    </button>
  )
}

function ActionButton({ onClick, icon, children, className = '' }: { onClick: () => void; icon: ReactNode; children: ReactNode; className?: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-semibold transition-colors hover:bg-white/[0.1] ${className}`}>{icon}{children}</button>
}

function NoteDialog({ label, text, initial, onSave, onClose }: { label: string; text: string; initial: string; onSave: (note: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(initial)
  useEffect(() => { dialog.current?.showModal() }, [])
  return (
    <dialog ref={dialog} className="revival-dialog" aria-labelledby="note-title" onClose={onClose}>
      <form onSubmit={event => { event.preventDefault(); onSave(value) }} className="dialog-in fixed inset-x-0 bottom-0 m-auto w-full max-w-lg rounded-t-[28px] border glass glass-strong p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-0 sm:h-fit sm:rounded-[28px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Note</p>
        <h2 id="note-title" className="mt-2 font-heading text-xl font-semibold">{label}</h2>
        <p className="mt-3 line-clamp-3 font-scripture text-sm leading-6 text-muted-foreground">{text}</p>
        <textarea autoFocus value={value} onChange={event => setValue(event.target.value)} maxLength={2000} rows={5} placeholder="What is God showing you here?" className="mt-4 w-full rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-sm leading-6 outline-none focus:border-primary/50" />
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className="h-11 flex-1 rounded-full border border-white/[0.1] text-sm font-semibold">Cancel</button>
          <button type="submit" className="h-11 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground">Save note</button>
        </div>
      </form>
    </dialog>
  )
}
