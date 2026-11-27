import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { bookById, fetchChapter, formatReference } from './bible'

/**
 * One Bible narration player for the whole app. It lives above the routes, so
 * the reading keeps going when the member changes page, locks the phone or
 * switches apps; only Pause stops it. It moves on to the next chapter by
 * itself and shows on the lock screen with play, pause and skip controls.
 */

export const NARRATORS: Record<string, string> = { souer: 'Bob Souer', hays: 'Barry Hays', david: 'David Campbell' }

type Ref = { book: string; chapter: number }
export type AudioTrack = Ref & {
  translation: string
  narrator: string
  url: string
  title: string
  next: Ref | null
  previous: Ref | null
}

type Value = {
  track: AudioTrack | null
  playing: boolean
  loading: boolean
  time: number
  duration: number
  error: string
  /** Starts a chapter (from the start, or resumes it if it is already loaded). */
  playChapter: (ref: Ref & { translation: string; narrator: string }) => Promise<void>
  toggle: () => void
  pause: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  stop: () => void
  isCurrent: (ref: Ref) => boolean
}

const BibleAudioContext = createContext<Value | null>(null)

export function useBibleAudio() {
  const value = useContext(BibleAudioContext)
  if (!value) throw new Error('useBibleAudio must be used inside BibleAudioProvider')
  return value
}

const RESUME_KEY = 'revival.bible.audio'

async function loadTrack(ref: Ref & { translation: string; narrator: string }): Promise<AudioTrack | null> {
  const data = await fetchChapter(ref.translation, ref.book, ref.chapter)
  const links = data.thisChapterAudioLinks ?? {}
  const narrator = links[ref.narrator] ? ref.narrator : Object.keys(links)[0]
  if (!narrator) return null
  const pick = (target?: { book: string; chapter: number } | null) => (target ? { book: target.book, chapter: target.chapter } : null)
  return {
    ...ref,
    narrator,
    url: links[narrator],
    title: formatReference(ref),
    next: pick(data.nextChapterReference),
    previous: pick(data.previousChapterReference),
  }
}

export function BibleAudioProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const trackRef = useRef<AudioTrack | null>(null)
  trackRef.current = track

  // One audio element for the life of the app (never inside a page that unmounts).
  if (!audio.current && typeof Audio !== 'undefined') {
    audio.current = new Audio()
    audio.current.preload = 'auto'
  }

  const start = useCallback(async (ref: Ref & { translation: string; narrator: string }, at = 0) => {
    const element = audio.current
    if (!element) return
    setLoading(true); setError('')
    try {
      const next = await loadTrack(ref)
      if (!next) { setError('This chapter doesn’t have narration in this translation. Switch to BSB to listen.'); setLoading(false); return }
      setTrack(next)
      element.src = next.url
      element.currentTime = at
      await element.play()
    } catch (caught) {
      // Autoplay can be refused before the first tap; the play button still works.
      if (!(caught instanceof DOMException && caught.name === 'NotAllowedError')) setError('We couldn’t play this chapter. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const playChapter = useCallback(async (ref: Ref & { translation: string; narrator: string }) => {
    const current = trackRef.current
    const element = audio.current
    if (current && element && current.book === ref.book && current.chapter === ref.chapter && current.narrator === ref.narrator && current.translation === ref.translation) {
      if (element.paused) await element.play().catch(() => undefined)
      return
    }
    await start(ref)
  }, [start])

  const toggle = useCallback(() => {
    const element = audio.current
    if (!element || !trackRef.current) return
    if (element.paused) void element.play().catch(() => undefined)
    else element.pause()
  }, [])

  const pause = useCallback(() => audio.current?.pause(), [])

  const jump = useCallback((target: Ref | null) => {
    const current = trackRef.current
    if (!target || !current) return
    void start({ ...target, translation: current.translation, narrator: current.narrator })
  }, [start])

  const next = useCallback(() => jump(trackRef.current?.next ?? null), [jump])
  const previous = useCallback(() => {
    const element = audio.current
    // Like a music player: back restarts the chapter unless you are at its start.
    if (element && element.currentTime > 5) { element.currentTime = 0; return }
    jump(trackRef.current?.previous ?? null)
  }, [jump])

  const seek = useCallback((seconds: number) => {
    const element = audio.current
    if (element) element.currentTime = Math.min(Math.max(0, seconds), element.duration || seconds)
  }, [])

  const stop = useCallback(() => {
    const element = audio.current
    if (element) { element.pause(); element.removeAttribute('src'); element.load() }
    setTrack(null); setPlaying(false); setTime(0); setDuration(0)
    try { window.localStorage.removeItem(RESUME_KEY) } catch { /* storage unavailable */ }
  }, [])

  // Element events.
  useEffect(() => {
    const element = audio.current
    if (!element) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => { setTime(element.currentTime); setDuration(element.duration || 0) }
    const onEnded = () => {
      // Carry on to the next chapter by itself.
      const current = trackRef.current
      if (current?.next) void start({ ...current.next, translation: current.translation, narrator: current.narrator })
      else setPlaying(false)
    }
    element.addEventListener('play', onPlay)
    element.addEventListener('pause', onPause)
    element.addEventListener('timeupdate', onTime)
    element.addEventListener('loadedmetadata', onTime)
    element.addEventListener('ended', onEnded)
    return () => {
      element.removeEventListener('play', onPlay)
      element.removeEventListener('pause', onPause)
      element.removeEventListener('timeupdate', onTime)
      element.removeEventListener('loadedmetadata', onTime)
      element.removeEventListener('ended', onEnded)
    }
  }, [start])

  // Lock screen, headphones and car controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    const book = bookById(track.book)
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: `${NARRATORS[track.narrator] ?? 'Narrator'} · ${track.translation}`,
      album: book ? `${book.name} · Revival Sound Tent` : 'Revival Sound Tent',
      artwork: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    })
    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => void audio.current?.play()],
      ['pause', () => audio.current?.pause()],
      ['nexttrack', track.next ? () => next() : null],
      ['previoustrack', () => previous()],
      ['seekbackward', details => seek((audio.current?.currentTime ?? 0) - (details.seekOffset ?? 15))],
      ['seekforward', details => seek((audio.current?.currentTime ?? 0) + (details.seekOffset ?? 15))],
      ['seekto', details => { if (details.seekTime !== undefined) seek(details.seekTime) }],
    ]
    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* not supported here */ }
    }
  }, [track, next, previous, seek])

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = track ? (playing ? 'playing' : 'paused') : 'none'
  }, [playing, track])

  // Remember where the reading was, so it can resume after the app is reopened.
  useEffect(() => {
    if (!track) return
    try { window.localStorage.setItem(RESUME_KEY, JSON.stringify({ book: track.book, chapter: track.chapter, translation: track.translation, narrator: track.narrator, time: Math.floor(time) })) } catch { /* storage unavailable */ }
  }, [track, Math.floor(time / 5)]) // eslint-disable-line react-hooks/exhaustive-deps

  // Bring back the last chapter (paused) when the app opens again.
  useEffect(() => {
    let saved: { book: string; chapter: number; translation: string; narrator: string; time: number } | null = null
    try { saved = JSON.parse(window.localStorage.getItem(RESUME_KEY) || 'null') } catch { saved = null }
    if (!saved || !audio.current) return
    void loadTrack(saved).then(restored => {
      if (!restored || !audio.current || trackRef.current) return
      setTrack(restored)
      audio.current.src = restored.url
      audio.current.currentTime = saved!.time || 0
      setTime(saved!.time || 0)
    }).catch(() => undefined)
  }, [])

  const isCurrent = useCallback((ref: Ref) => Boolean(track && track.book === ref.book && track.chapter === ref.chapter), [track])

  const value = useMemo<Value>(() => ({ track, playing, loading, time, duration, error, playChapter, toggle, pause, next, previous, seek, stop, isCurrent }),
    [track, playing, loading, time, duration, error, playChapter, toggle, pause, next, previous, seek, stop, isCurrent])

  return <BibleAudioContext.Provider value={value}>{children}</BibleAudioContext.Provider>
}
