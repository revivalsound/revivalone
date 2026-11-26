import { Fragment, type ReactNode } from 'react'
import { joinSpace, type ChapterContent, type ChapterVerse } from '../../lib/bible'
import { HIGHLIGHT_COLORS, type Highlight } from '../../lib/reading'

type Footnote = { noteId: number; text: string; caller?: string | null }

type Props = {
  content: ChapterContent[]
  footnotes: Footnote[]
  highlights: Map<number, Highlight>
  selected: Set<number>
  flash?: number | null
  redLetters: boolean
  verseNumbers: boolean
  size: number
  onVerse: (verse: number) => void
  onFootnote: (note: Footnote) => void
}

type Block = { kind: 'heading' | 'subtitle'; node: ReactNode } | { kind: 'para'; poem: boolean; nodes: ReactNode[] }

const WASH = Object.fromEntries(HIGHLIGHT_COLORS.map(color => [color.id, color.wash]))

/**
 * Renders a chapter from the Free Use Bible API: section headings, paragraphs,
 * poetry indents, the words of Jesus, footnote markers and tappable verses.
 */
export default function ChapterText({ content, footnotes, highlights, selected, flash, redLetters, verseNumbers, size, onVerse, onFootnote }: Props) {
  const notes = new Map(footnotes.map(note => [note.noteId, note]))
  const blocks: Block[] = []
  let para: Extract<Block, { kind: 'para' }> | null = null
  const open = (poem = false) => { para = { kind: 'para', poem, nodes: [] }; blocks.push(para) }

  content.forEach((item, index) => {
    if (item.type === 'heading') {
      blocks.push({ kind: 'heading', node: item.content.join(' ') })
      para = null
    } else if (item.type === 'hebrew_subtitle') {
      blocks.push({ kind: 'subtitle', node: item.content.map(part => (typeof part === 'string' ? part : 'text' in part ? part.text : '')).join(' ') })
      para = null
    } else if (item.type === 'line_break') {
      open(item.paragraph?.startsWith('q') ?? false)
    } else if (item.type === 'verse') {
      if (!para) open()
      para!.nodes.push(<Verse key={`v${item.number}-${index}`} verse={item} notes={notes} highlight={highlights.get(item.number)} selected={selected.has(item.number)} flash={flash === item.number} redLetters={redLetters} verseNumbers={verseNumbers} onVerse={onVerse} onFootnote={onFootnote} />)
    }
  })

  return (
    <div className="font-scripture text-foreground/[0.92]" style={{ fontSize: size, lineHeight: 1.85 }}>
      {blocks.map((block, index) => {
        if (block.kind === 'heading') return <h3 key={index} className="mb-3 mt-9 font-heading text-[0.78em] font-semibold uppercase tracking-[0.14em] text-primary first:mt-0">{block.node}</h3>
        if (block.kind === 'subtitle') return <p key={index} className="mb-3 text-[0.85em] italic text-muted-foreground">{block.node}</p>
        if (block.kind !== 'para' || !block.nodes.length) return null
        return <p key={index} className={block.poem ? 'mb-1 pl-[1.6em]' : 'mb-[1.05em]'}>{block.nodes}</p>
      })}
    </div>
  )
}

function Verse({ verse, notes, highlight, selected, flash, redLetters, verseNumbers, onVerse, onFootnote }: {
  verse: ChapterVerse; notes: Map<number, Footnote>; highlight?: Highlight; selected: boolean; flash: boolean; redLetters: boolean; verseNumbers: boolean
  onVerse: (verse: number) => void; onFootnote: (note: Footnote) => void
}) {
  const wash = highlight && highlight.color !== 'none' ? WASH[highlight.color] : undefined
  return (
    <span
      id={`v${verse.number}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Verse ${verse.number}`}
      onClick={() => onVerse(verse.number)}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onVerse(verse.number) } }}
      className={`scroll-mt-28 cursor-pointer rounded-[4px] decoration-primary/70 decoration-2 underline-offset-[5px] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 ${selected ? 'underline' : ''} ${flash ? 'verse-flash' : ''}`}
      style={wash ? { backgroundColor: wash, boxShadow: `0 0 0 2px ${wash}` } : undefined}
    >
      {verseNumbers && <sup className="mr-1 select-none font-heading text-[0.58em] font-semibold text-primary/80">{verse.number}</sup>}
      {verse.content.map((part, index) => {
        if (typeof part === 'string' || 'text' in part) {
          const text = typeof part === 'string' ? part : part.text
          const space = joinSpace(previousText(verse.content, index), text)
          if (typeof part === 'string') return <Fragment key={index}>{space}{part}</Fragment>
          return <Fragment key={index}>{space}<span className={`${part.wordsOfJesus && redLetters ? 'text-[#ff8fb0]' : ''} ${part.poem ? 'block pl-[1.6em]' : ''}`}>{part.text}</span></Fragment>
        }
        if ('lineBreak' in part) return <br key={index} />
        if ('heading' in part) return <span key={index} className="my-2 block font-heading text-[0.78em] font-semibold uppercase tracking-[0.14em] text-primary">{part.heading}</span>
        if ('noteId' in part) {
          const note = notes.get(part.noteId)
          if (!note) return null
          return (
            <button key={index} type="button" onClick={event => { event.stopPropagation(); onFootnote(note) }} aria-label="Footnote" className="mx-0.5 inline-flex h-4 w-4 -translate-y-1.5 items-center justify-center rounded-full bg-primary/15 align-baseline font-heading text-[9px] font-bold text-primary hover:bg-primary hover:text-primary-foreground">
              {note.caller && note.caller !== '+' ? note.caller : '*'}
            </button>
          )
        }
        return null
      })}
      {highlight?.note && <span aria-label="Has a note" className="mx-1 inline-block h-1.5 w-1.5 -translate-y-1 rounded-full bg-[#ffd479]" />}
      {' '}
    </span>
  )
}

/** The nearest text before a part, so neighbouring pieces get a space between them. */
function previousText(parts: ChapterVerse['content'], index: number) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const part = parts[i]
    if (typeof part === 'string') return part
    if ('text' in part) return part.text
    if ('lineBreak' in part || 'heading' in part) return ''
  }
  return ''
}
