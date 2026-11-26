import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Search, X } from '../ui/icons'
import { BIBLE_BOOKS, type BibleBook } from '../../lib/bible'

/** Pick a book, then a chapter. Opens on the current book's chapters. */
export default function BookPicker({ current, chapter, onPick, onClose }: { current: BibleBook; chapter: number; onPick: (book: BibleBook, chapter: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [book, setBook] = useState<BibleBook | null>(current)
  const [testament, setTestament] = useState<'OT' | 'NT'>(current.testament)
  const [query, setQuery] = useState('')

  useEffect(() => { dialog.current?.showModal() }, [])
  const close = () => dialog.current?.close()

  const books = BIBLE_BOOKS.filter(item => (query ? item.name.toLowerCase().includes(query.trim().toLowerCase()) : item.testament === testament))

  return (
    <dialog ref={dialog} className="revival-dialog" aria-labelledby="picker-title" onClose={onClose}>
      <div className="dialog-in fixed inset-x-0 bottom-0 m-auto flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border glass glass-strong shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-0 sm:h-fit sm:rounded-[28px]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] p-4 sm:p-5">
          {book && !query ? (
            <button type="button" onClick={() => setBook(null)} aria-label="All books" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></button>
          ) : null}
          <h2 id="picker-title" className="flex-1 font-heading text-xl font-semibold">{book && !query ? book.name : 'Choose a book'}</h2>
          <button type="button" onClick={close} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {book && !query ? (
          <div className="overflow-y-auto p-4 sm:p-5">
            <p className="mb-3 text-xs text-muted-foreground">{book.chapters} chapter{book.chapters > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
              {Array.from({ length: book.chapters }, (_, index) => index + 1).map(number => {
                const active = book.id === current.id && number === chapter
                return (
                  <button key={number} type="button" onClick={() => { onPick(book, number); close() }} className={`flex aspect-square items-center justify-center rounded-xl font-heading text-sm font-semibold transition-colors ${active ? 'bg-primary text-primary-foreground' : 'border border-white/[0.08] bg-white/[0.03] hover:border-primary/40 hover:text-primary'}`}>{number}</button>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:p-5 sm:pb-0">
              <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
                {(['OT', 'NT'] as const).map(value => (
                  <button key={value} type="button" onClick={() => { setTestament(value); setQuery('') }} className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${testament === value && !query ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{value === 'OT' ? 'Old Testament' : 'New Testament'}</button>
                ))}
              </div>
              <label className="relative flex-1">
                <span className="sr-only">Search books</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search books" className="h-11 w-full rounded-full border border-white/[0.09] bg-white/[0.03] pl-10 pr-4 text-sm outline-none focus:border-primary/50" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 sm:p-5">
              {books.map(item => (
                <button key={item.id} type="button" onClick={() => { setBook(item); setQuery('') }} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${item.id === current.id ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-white/[0.07] bg-white/[0.02] hover:border-primary/30'}`}>
                  <span className="truncate">{item.name}</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">{item.chapters}</span>
                </button>
              ))}
              {books.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No book matches “{query}”.</p>}
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
