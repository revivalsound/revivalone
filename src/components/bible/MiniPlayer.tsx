import { Link, useLocation } from 'react-router-dom'
import { Headphones, Loader, PauseCircle, Play, SkipNext, SkipPrevious, X } from '../ui/icons'
import { bookById, bookSlug } from '../../lib/bible'
import { NARRATORS, useBibleAudio } from '../../lib/bibleAudio'

/** Keeps the Bible reading in reach on every page: play/pause, skip, and back to the chapter. */
export default function MiniPlayer() {
  const { track, playing, loading, time, duration, toggle, next, previous, stop } = useBibleAudio()
  const { pathname } = useLocation()
  if (!track) return null

  const book = bookById(track.book)
  const href = `/bible/${track.translation}/${book ? bookSlug(book) : track.book}/${track.chapter}`
  // The reader has its own controls for the chapter it is showing.
  if (pathname === href) return null

  const progress = duration ? Math.min(1, time / duration) : 0
  return (
    <div className="mini-player fixed inset-x-3 bottom-[5.6rem] z-30 mx-auto max-w-md overflow-hidden rounded-[22px] border border-white/[0.1] bg-surface-raised shadow-[0_20px_50px_rgba(0,0,0,0.45)] lg:bottom-5 lg:left-auto lg:right-6 lg:mx-0 lg:w-[360px]" role="region" aria-label="Bible audio">
      <div className="flex items-center gap-3 p-2.5 pr-2">
        <Link to={href} className="flex min-w-0 flex-1 items-center gap-3" aria-label={`Open ${track.title}`}>
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ${playing ? 'brand-ring brand-ring--on' : ''}`}><Headphones className="h-5 w-5" /></span>
          <span className="min-w-0">
            <b className="block truncate font-heading text-[14px] font-semibold">{track.title}</b>
            <small className="block truncate text-[11px] text-muted-foreground">{playing ? 'Reading aloud' : 'Paused'} · {NARRATORS[track.narrator] ?? 'Narrator'}</small>
          </span>
        </Link>
        <button type="button" onClick={previous} aria-label="Previous chapter" className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:flex"><SkipPrevious className="h-4 w-4" /></button>
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_22px_rgba(255,92,138,0.35)] active:scale-95">
          {loading ? <Loader className="h-5 w-5 animate-spin" /> : playing ? <PauseCircle className="h-6 w-6" /> : <Play className="h-5 w-5" />}
        </button>
        <button type="button" onClick={next} disabled={!track.next} aria-label="Next chapter" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30"><SkipNext className="h-4 w-4" /></button>
        <button type="button" onClick={stop} aria-label="Close player" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="h-[3px] bg-white/[0.06]"><div className="h-full bg-gradient-to-r from-[#ff5c8a] to-[#ffb36b] transition-[width] duration-500" style={{ width: `${progress * 100}%` }} /></div>
    </div>
  )
}
