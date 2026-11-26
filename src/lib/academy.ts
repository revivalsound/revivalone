import { useCallback, useEffect, useState } from 'react'
import { EPISODE_SECONDS } from './academy-audio.generated'
import { COURSES, type Course } from './content'

/** Listening progress per course, kept on this device. */
export type CourseProgress = { done: number[]; current: number; position: number }

const KEY = 'revival.academy'
const EVENT = 'revival:academy'

function readAll(): Record<string, CourseProgress> {
  try { return JSON.parse(window.localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function writeAll(value: Record<string, CourseProgress>) {
  try { window.localStorage.setItem(KEY, JSON.stringify(value)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT))
}

const EMPTY: CourseProgress = { done: [], current: 1, position: 0 }

export function readProgress(slug: string): CourseProgress {
  return { ...EMPTY, ...readAll()[slug] }
}

export function saveProgress(slug: string, update: (current: CourseProgress) => CourseProgress) {
  const all = readAll()
  all[slug] = update({ ...EMPTY, ...all[slug] })
  writeAll(all)
}

/** Live progress for one course, updated across tabs and components. */
export function useCourseProgress(slug: string) {
  const [progress, setProgress] = useState(() => readProgress(slug))
  useEffect(() => {
    const sync = () => setProgress(readProgress(slug))
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync) }
  }, [slug])

  const markDone = useCallback((episode: number) => saveProgress(slug, current => ({
    ...current,
    done: current.done.includes(episode) ? current.done : [...current.done, episode].sort((a, b) => a - b),
    position: 0,
  })), [slug])

  return { progress, markDone }
}

export function courseBySlug(slug: string): Course | undefined {
  return COURSES.find(course => course.slug === slug)
}

export const audioFor = (slug: string, episode: number) => `/audio/academy/${slug}/${episode}.mp3`
export const episodeSeconds = (slug: string, episode: number) => EPISODE_SECONDS[slug]?.[episode - 1] ?? 0
export const courseSeconds = (slug: string) => (EPISODE_SECONDS[slug] ?? []).reduce((sum, value) => sum + value, 0)

/** The first episode not yet finished, or the last one if all are done. */
export function nextEpisode(course: Course, progress: CourseProgress) {
  for (let episode = 1; episode <= course.episodes.length; episode += 1) if (!progress.done.includes(episode)) return episode
  return course.episodes.length
}

export function clock(total: number) {
  const value = Math.max(0, Math.floor(total))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

export function runtime(total: number) {
  if (total < 60) return `${total} sec`
  const minutes = Math.round(total / 60)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}
