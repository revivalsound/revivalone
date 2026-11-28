import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Pause, Play, Volume } from '../ui/icons'
import { mediaGeometry } from '../../lib/mediaEditing'
import type { PostMedia } from '../../lib/posts'

/** One renderer for draft, full-screen preview, feed, and published media. */
export default function MediaFrame({ item, controls = false, alt = 'Post attachment', onDimensions }: {
  item: PostMedia; controls?: boolean; alt?: string
  onDimensions?: (width: number, height: number, duration?: number) => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [error, setError] = useState(false)
  const edit = item.edit
  const geometry = edit ? mediaGeometry(edit) : null
  const style: CSSProperties = geometry ? {
    position: 'absolute', width: geometry.width, height: geometry.height, left: geometry.left, top: geometry.top,
    maxWidth: 'none', transform: `translate(-50%, -50%) rotate(${edit!.rotation}deg)`,
    filter: `brightness(${edit!.brightness}%) contrast(${edit!.contrast}%)`,
  } : { display: 'block', width: '100%', height: 'auto' }
  const start = edit?.start ?? 0
  const end = Math.min(edit?.end ?? duration, duration)
  useEffect(() => {
    const el = video.current
    if (el && el.readyState >= 1 && (el.currentTime < start || el.currentTime >= end)) el.currentTime = start
  }, [start, end])
  return (
    <div className="w-full overflow-hidden bg-black">
      <div className="relative overflow-hidden" style={geometry ? { aspectRatio: geometry.aspect } : undefined}>
        {item.type === 'image' ? <img src={item.url} alt={alt} loading="lazy" style={style} onError={() => setError(true)} onLoad={event => onDimensions?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} /> : (
          <video ref={video} src={item.url} playsInline preload="metadata" muted={!controls || muted || edit?.muted} style={style}
            onLoadedMetadata={event => {
              const el = event.currentTarget
              setDuration(el.duration); setTime(start)
              el.currentTime = start || Math.min(.01, el.duration / 2)
              onDimensions?.(el.videoWidth, el.videoHeight, el.duration)
            }}
            onError={() => setError(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onTimeUpdate={event => {
              const el = event.currentTarget
              if (el.currentTime < start) el.currentTime = start
              if (end > start && el.currentTime >= end) { el.pause(); el.currentTime = start }
              setTime(el.currentTime)
            }} />
        )}
      </div>
      {error && <p role="alert" className="theme-dark p-4 text-sm leading-6 text-white">This {item.type === 'image' ? 'photo' : 'video'} couldn’t be opened. Try a JPG, PNG, or an MP4 video supported by your browser.</p>}
      {item.type === 'video' && controls && <div className="theme-dark flex items-center gap-3 px-3 py-2 text-white">
        <button type="button" aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10" onClick={() => {
          const el = video.current
          if (!el) return
          if (el.paused) { if (el.currentTime < start || el.currentTime >= end) el.currentTime = start; void el.play().catch(() => setPlaying(false)) }
          else el.pause()
        }}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
        <input type="range" aria-label="Video position" min={start} max={Math.max(start + .01, end)} step="0.05" value={Math.max(start, Math.min(end || start, time))} className="min-w-0 flex-1 accent-primary" onChange={event => { if (video.current) { video.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)) } }} />
        <span className="text-xs tabular-nums">{Math.floor(Math.max(0, time - start))}s</span>
        <button type="button" aria-label={muted ? 'Unmute video' : 'Mute video'} aria-pressed={muted || Boolean(edit?.muted)} disabled={edit?.muted} onClick={() => setMuted(value => !value)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"><Volume className="h-4 w-4" /></button>
      </div>}
    </div>
  )
}
