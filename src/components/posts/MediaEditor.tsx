import { useEffect, useRef, useState } from 'react'
import { Check, RefreshCw, X } from '../ui/icons'
import { defaultMediaEdit, type MediaEdit } from '../../lib/mediaEditing'
import type { PostMedia } from '../../lib/posts'
import MediaFrame from './MediaFrame'

const FRAMES = [{ label: 'Original', value: null }, { label: 'Square', value: 1 }, { label: 'Portrait', value: 4 / 5 }, { label: 'Story', value: 9 / 16 }, { label: 'Landscape', value: 16 / 9 }]

/** Edits are non-destructive: returning to Original never loses pixels. */
export default function MediaEditor({ item, onSave, onClose }: { item: PostMedia; onSave: (edit: MediaEdit) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [edit, setEdit] = useState<MediaEdit | null>(item.edit ?? null)
  const [duration, setDuration] = useState(0)
  const patch = (value: Partial<MediaEdit>) => setEdit(current => current ? { ...current, ...value } : current)
  useEffect(() => {
    const el = dialog.current!
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    el.showModal()
    return () => { el.close(); document.body.style.overflow = previousOverflow }
  }, [])
  return <dialog ref={dialog} aria-labelledby="media-editor-title" onCancel={onClose} className="media-dialog m-auto max-h-[94dvh] w-[min(1080px,96vw)] max-w-none overflow-y-auto rounded-[24px] bg-surface text-foreground shadow-2xl backdrop:bg-black/85">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.08] bg-surface p-4 sm:px-6">
      <div><h2 id="media-editor-title" className="font-heading text-lg font-semibold">Edit {item.type === 'image' ? 'photo' : 'video'}</h2><p className="mt-1 text-xs text-muted-foreground">Your original stays untouched.</p></div>
      <button type="button" aria-label="Close media editor" className="media-icon" onClick={onClose}><X className="h-5 w-5" /></button>
    </header>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-0 items-center justify-center bg-black/40 p-4 sm:p-6">
        <div className="w-full overflow-hidden rounded-2xl" style={{ maxWidth: edit ? `${Math.min(700, (edit.aspect ?? (edit.rotation % 180 ? edit.height / edit.width : edit.width / edit.height)) * 480)}px` : undefined }}>
          <MediaFrame item={{ ...item, edit: edit ?? undefined }} controls onDimensions={(width, height, seconds) => {
            if (!edit) setEdit(defaultMediaEdit(width, height))
            if (seconds && Number.isFinite(seconds)) setDuration(seconds)
          }} />
        </div>
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        <fieldset disabled={!edit}>
          <legend className="mb-3 text-sm font-semibold">Frame</legend>
          <div className="flex flex-wrap gap-2">{FRAMES.map(frame => <button key={frame.label} type="button" aria-pressed={edit?.aspect === frame.value} onClick={() => patch({ aspect: frame.value, zoom: 1, x: 0, y: 0 })} className={`rounded-full border px-3 py-2 text-xs font-medium ${edit?.aspect === frame.value ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:text-foreground'}`}>{frame.label}</button>)}</div>
        </fieldset>
        {edit && <>
          <div className="space-y-4">
            <Slider label="Zoom" value={edit.zoom} min={1} max={3} step={.01} display={`${edit.zoom.toFixed(2)}×`} onChange={zoom => patch({ zoom })} />
            <Slider label="Horizontal position" value={edit.x} min={-1} max={1} step={.01} onChange={x => patch({ x })} />
            <Slider label="Vertical position" value={edit.y} min={-1} max={1} step={.01} onChange={y => patch({ y })} />
            <button type="button" onClick={() => patch({ rotation: (edit.rotation + 90) % 360, x: 0, y: 0 })} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-semibold"><RefreshCw className="h-4 w-4" /> Rotate 90°</button>
          </div>
          <div className="space-y-4 border-t border-white/[0.08] pt-5">
            <Slider label="Brightness" min={50} max={150} value={edit.brightness} display={`${edit.brightness}%`} onChange={brightness => patch({ brightness })} />
            <Slider label="Contrast" min={50} max={150} value={edit.contrast} display={`${edit.contrast}%`} onChange={contrast => patch({ contrast })} />
          </div>
          {item.type === 'video' && duration > 0 && <fieldset className="space-y-4 border-t border-white/[0.08] pt-5">
            <legend className="pt-5 text-sm font-semibold">Playback</legend>
            <Slider label="Start time" min={0} max={Math.max(0, (edit.end ?? duration) - .1)} step={.1} value={edit.start ?? 0} display={`${(edit.start ?? 0).toFixed(1)}s`} onChange={start => patch({ start })} />
            <Slider label="End time" min={(edit.start ?? 0) + .1} max={duration} step={.1} value={edit.end ?? duration} display={`${(edit.end ?? duration).toFixed(1)}s`} onChange={end => patch({ end })} />
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={edit.muted ?? false} onChange={event => patch({ muted: event.target.checked })} /> Publish without sound</label>
            <p className="text-xs leading-5 text-muted-foreground">Only this time range plays in the post. The original video file is preserved.</p>
          </fieldset>}
        </>}
      </div>
    </div>
    <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-white/[0.08] bg-surface p-4 sm:px-6">
      <button type="button" disabled={!edit} onClick={() => edit && setEdit(defaultMediaEdit(edit.width, edit.height))} className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /> Reset</button>
      <div className="flex gap-2"><button type="button" onClick={onClose} className="h-11 rounded-full px-4 text-sm font-medium">Cancel</button><button type="button" disabled={!edit} onClick={() => edit && onSave(edit)} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40"><Check className="h-4 w-4" /> Save edits</button></div>
    </footer>
  </dialog>
}

function Slider({ label, value, min, max, step = 1, display, onChange }: { label: string; value: number; min: number; max: number; step?: number; display?: string; onChange: (value: number) => void }) {
  return <label className="block text-xs font-medium"><span className="mb-2 flex items-center justify-between gap-2">{label}<span className="tabular-nums text-muted-foreground">{display}</span></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="block w-full accent-primary" /></label>
}
