import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Link as LinkIcon, Loader, Notebook, Pen } from '../ui/icons'
import { COMMENTARIES, fetchCommentary, fetchCrossReferences, fetchPassageText, formatReference, readerPath, type CommentaryId, type CommentaryNote, type CrossReference } from '../../lib/bible'
import type { Highlight } from '../../lib/reading'

type Tab = 'notes' | 'cross' | 'mine'

/** Study notes, commentary and cross references for the chapter, plus your own notes. */
export default function StudyPanel({ translation, book, chapter, focusVerse, highlights, onJump }: {
  translation: string; book: string; chapter: number; focusVerse: number | null; highlights: Highlight[]; onJump: (verse: number) => void
}) {
  const [tab, setTab] = useState<Tab>('notes')
  const [commentary, setCommentary] = useState<CommentaryId>('tyndale')
  const [notes, setNotes] = useState<{ introduction: string; bookIntroduction: string; notes: CommentaryNote[] } | null>(null)
  const [refs, setRefs] = useState<Map<number, CrossReference[]> | null>(null)

  useEffect(() => { if (focusVerse) setTab(current => (current === 'mine' ? current : 'cross')) }, [focusVerse])

  useEffect(() => {
    let live = true
    setNotes(null)
    fetchCommentary(commentary, book, chapter).then(result => live && setNotes(result)).catch(() => live && setNotes({ introduction: '', bookIntroduction: '', notes: [] }))
    return () => { live = false }
  }, [commentary, book, chapter])

  useEffect(() => {
    let live = true
    setRefs(null)
    fetchCrossReferences(book, chapter).then(result => live && setRefs(result))
    return () => { live = false }
  }, [book, chapter])

  const mine = highlights.filter(item => item.note).sort((a, b) => a.verse - b.verse)
  const shownNotes = notes?.notes.filter(note => !focusVerse || note.verse === focusVerse) ?? []

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="tablist">
        {([['notes', 'Study'], ['cross', 'Cross refs'], ['mine', `My notes${mine.length ? ` · ${mine.length}` : ''}`]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`h-9 flex-1 rounded-full px-2 text-xs font-semibold transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === 'notes' && (
          <>
            <select value={commentary} onChange={event => setCommentary(event.target.value as CommentaryId)} aria-label="Commentary" className="h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.03] px-4 text-xs font-semibold outline-none [color-scheme:dark]">
              {COMMENTARIES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            {focusVerse && <p className="mt-3 text-[11px] text-muted-foreground">Showing notes on verse {focusVerse}.</p>}
            {notes === null ? <Spinner /> : (
              <div className="mt-4 space-y-4">
                {!focusVerse && notes.introduction && <Note label="About this chapter" text={notes.introduction} />}
                {shownNotes.map((note, index) => (
                  <button key={`${note.verse}-${index}`} type="button" onClick={() => onJump(note.verse)} className="block w-full rounded-[18px] border border-white/[0.07] bg-surface p-4 text-left transition-colors hover:border-primary/30">
                    <span className="font-heading text-[11px] font-semibold text-primary">Verse {note.verse}</span>
                    <span className="mt-1.5 block whitespace-pre-line text-[13px] leading-6 text-foreground/85">{note.text.length > 900 ? `${note.text.slice(0, 900)}…` : note.text}</span>
                  </button>
                ))}
                {shownNotes.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No {COMMENTARIES.find(item => item.id === commentary)?.name.toLowerCase()} {focusVerse ? 'for this verse' : 'for this chapter'}.</p>}
                <p className="text-[10px] text-muted-foreground/70">Public-domain notes from the Free Use Bible API.</p>
              </div>
            )}
          </>
        )}

        {tab === 'cross' && (
          focusVerse ? (
            refs === null ? <Spinner /> : <CrossRefs translation={translation} references={(refs.get(focusVerse) ?? []).slice(0, 8)} from={formatReference({ book, chapter, verse: focusVerse })} />
          ) : <p className="py-8 text-center text-sm text-muted-foreground">Tap a verse to see where else the Bible speaks to it.</p>
        )}

        {tab === 'mine' && (
          mine.length ? (
            <div className="space-y-3">
              {mine.map(item => (
                <button key={item.verse} type="button" onClick={() => onJump(item.verse)} className="block w-full rounded-[18px] border border-white/[0.07] bg-surface p-4 text-left hover:border-primary/30">
                  <span className="flex items-center gap-1.5 font-heading text-[11px] font-semibold text-primary"><Pen className="h-3.5 w-3.5" /> Verse {item.verse}</span>
                  <span className="mt-1.5 block whitespace-pre-line text-[13px] leading-6 text-foreground/85">{item.note}</span>
                </button>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-muted-foreground"><Notebook className="mx-auto mb-3 h-6 w-6 text-primary" />Tap a verse and choose Note to write what God is showing you.</p>
        )}
      </div>
    </div>
  )
}

function CrossRefs({ translation, references, from }: { translation: string; references: CrossReference[]; from: string }) {
  const [texts, setTexts] = useState<Record<string, string>>({})
  useEffect(() => {
    let live = true
    references.forEach(reference => {
      const key = formatReference(reference)
      fetchPassageText(reference, translation).then(text => live && setTexts(current => ({ ...current, [key]: text }))).catch(() => undefined)
    })
    return () => { live = false }
  }, [references, translation])

  if (!references.length) return <p className="py-8 text-center text-sm text-muted-foreground">No cross references for {from}.</p>
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Passages linked to {from}, strongest first.</p>
      {references.map(reference => {
        const key = formatReference(reference)
        return (
          <Link key={key} to={readerPath(reference, translation)} className="block rounded-[18px] border border-white/[0.07] bg-surface p-4 transition-colors hover:border-primary/30">
            <span className="flex items-center gap-1.5 font-heading text-[12px] font-semibold text-primary"><LinkIcon className="h-3.5 w-3.5" /> {key}</span>
            <span className="mt-1.5 block font-scripture text-[14px] leading-6 text-foreground/85">{texts[key] ?? '…'}</span>
          </Link>
        )
      })}
      <p className="text-[10px] text-muted-foreground/70">Cross references from OpenBible.info (CC BY 4.0) via the Free Use Bible API.</p>
    </div>
  )
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-primary/20 bg-primary/[0.06] p-4">
      <p className="font-heading text-[11px] font-semibold text-primary">{label}</p>
      <p className="mt-1.5 whitespace-pre-line text-[13px] leading-6 text-foreground/85">{text}</p>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-10"><Loader className="h-5 w-5 animate-spin text-primary" /></div>
}
