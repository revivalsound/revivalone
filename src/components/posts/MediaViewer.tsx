import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from '../ui/icons'
import type { PostMedia } from '../../lib/posts'
import MediaFrame from './MediaFrame'
import { mediaGeometry } from '../../lib/mediaEditing'

export default function MediaViewer({ media, index, onIndex, onClose }: { media: PostMedia[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current!
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    el.showModal()
    return () => { el.close(); document.body.style.overflow = previousOverflow }
  }, [])
  return <dialog ref={dialog} aria-label="Media preview" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }} onKeyDown={event => {
    if (event.key === 'ArrowRight') onIndex((index + 1) % media.length)
    if (event.key === 'ArrowLeft') onIndex((index - 1 + media.length) % media.length)
  }} className="media-dialog m-auto max-h-[94dvh] w-[min(960px,96vw)] max-w-none overflow-y-auto rounded-[24px] bg-surface p-3 text-foreground shadow-2xl backdrop:bg-black/85 sm:p-5">
    <header className="mb-3 flex items-center justify-between gap-3">
      <span className="pl-2 text-sm font-semibold">Preview <span className="ml-2 text-muted-foreground">{index + 1} / {media.length}</span></span>
      <div className="flex items-center gap-1">
        {media.length > 1 && <><button type="button" aria-label="Previous attachment" onClick={() => onIndex((index - 1 + media.length) % media.length)} className="media-icon"><ChevronLeft className="h-5 w-5" /></button><button type="button" aria-label="Next attachment" onClick={() => onIndex((index + 1) % media.length)} className="media-icon"><ChevronRight className="h-5 w-5" /></button></>}
        <button type="button" aria-label="Close preview" onClick={onClose} className="media-icon"><X className="h-5 w-5" /></button>
      </div>
    </header>
    <div className="mx-auto overflow-hidden rounded-2xl" style={{ maxWidth: media[index].edit ? `min(100%, ${mediaGeometry(media[index].edit!).aspect * 65}vh)` : undefined }}><MediaFrame key={media[index].url} item={media[index]} controls alt={`Attachment ${index + 1}`} /></div>
  </dialog>
}
