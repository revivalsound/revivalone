import { useEffect, useRef, useState, type DragEvent } from 'react'
import { CloudUpload, GalleryAdd, Trash, VideoFrame } from '../ui/icons'
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from '../../lib/community'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime'

/** Choose (or drop) a cover image or video. The file uploads when the form is submitted. */
export default function MediaPicker({ file, onChange, label = 'Cover image or video' }: { file: File | null; onChange: (file: File | null) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function take(candidate?: File | null) {
    if (!candidate) return
    const video = candidate.type.startsWith('video/')
    if (!ACCEPT.split(',').includes(candidate.type)) { setError('Use a JPG, PNG, WebP or GIF image, or an MP4, WebM or MOV video.'); return }
    if (candidate.size > (video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) { setError(video ? 'Videos can be up to 50 MB.' : 'Images can be up to 8 MB.'); return }
    setError('')
    onChange(candidate)
  }

  function drop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    take(event.dataTransfer.files?.[0])
  }

  const isVideo = file?.type.startsWith('video/')

  return (
    <div>
      <p className="text-xs font-medium text-foreground/90">{label}</p>
      {file && preview ? (
        <div className="group relative mt-2 overflow-hidden rounded-[20px] border border-white/[0.09] bg-black">
          {isVideo
            ? <video src={preview} controls muted playsInline className="aspect-video w-full object-cover" />
            : <img src={preview} alt="Selected cover" className="aspect-video w-full object-cover" />}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              {isVideo ? <VideoFrame className="h-3.5 w-3.5" /> : <GalleryAdd className="h-3.5 w-3.5" />}
              <span className="truncate">{file.name}</span>
            </span>
            <span className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => input.current?.click()} className="h-8 rounded-full bg-black/50 px-3 text-[11px] font-semibold text-white backdrop-blur-md hover:bg-black/70">Replace</button>
              <button type="button" onClick={() => onChange(null)} aria-label="Remove media" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-red-500/80"><Trash className="h-3.5 w-3.5" /></button>
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
          className={`bolt-card mt-2 flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed text-center transition-colors ${dragging ? 'bolt-card--on border-transparent bg-primary/[0.08]' : 'border-white/[0.14] bg-white/[0.02] hover:border-primary/40 hover:bg-primary/[0.04]'}`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><CloudUpload className="h-6 w-6" /></span>
          <span>
            <b className="block text-sm font-semibold">Add a photo or video</b>
            <small className="text-xs text-muted-foreground">Drag it here or browse · images up to 8 MB, videos up to 50 MB</small>
          </span>
          <span className="flex items-center gap-3 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><GalleryAdd className="h-3.5 w-3.5" /> JPG, PNG, WebP</span><span className="flex items-center gap-1"><VideoFrame className="h-3.5 w-3.5" /> MP4, MOV</span></span>
        </button>
      )}
      <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={event => { take(event.target.files?.[0]); event.target.value = '' }} />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  )
}
