import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from './icons'

/**
 * A bottom sheet on phones and a centred panel on larger screens. Always fits the
 * viewport, scrolls inside when long, and closes on the backdrop, Escape or ✕.
 */
export default function Sheet({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[3px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
        className="sheet-in flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/[0.1] glass glass-strong shadow-[0_-12px_60px_rgba(0,0,0,0.45)] sm:max-w-md sm:rounded-[28px]"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-3 sm:pt-5">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="safe-bottom min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 sm:px-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
