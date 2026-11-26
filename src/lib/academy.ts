import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

/* Rev Academy: audio courses made by members, delivered episode by episode. */

export type Episode = { id: string; number: number; title: string; summary: string; audio_url: string; duration_seconds: number }
export type Course = {
  id: string; slug: string; title: string; category: string; description: string; teacher: string; cover_url: string
  owner_id: string | null; published: boolean; created_at: string; episodes: Episode[]
}

export const COURSE_CATEGORIES = ['Spiritual formation', 'Bible', 'Prayer', 'Leadership', 'Evangelism', 'Kingdom business', 'Worship', 'Family']

/** Thrown when supabase/bible.sql hasn't been run yet. */
export class AcademyNotReady extends Error {
  constructor() { super('Rev Academy isn’t switched on yet. Run supabase/bible.sql in Supabase to turn it on.') }
}

function fail(error: { code?: string; message: string }): never {
  if (['PGRST205', '42P01', '42703', 'PGRST204', 'PGRST200'].includes(error.code ?? '')) throw new AcademyNotReady()
  throw new Error(error.message)
}

const COURSE = 'id, slug, title, category, description, teacher, cover_url, owner_id, published, created_at, episodes:academy_episodes(id, number, title, summary, audio_url, duration_seconds)'

const sortEpisodes = (course: Course) => ({ ...course, episodes: [...(course.episodes ?? [])].sort((a, b) => a.number - b.number) })

export async function fetchCourses() {
  const { data, error } = await supabase.from('academy_courses').select(COURSE).eq('published', true).order('created_at', { ascending: false })
  if (error) fail(error)
  return ((data ?? []) as unknown as Course[]).map(sortEpisodes).filter(course => course.episodes.length > 0)
}

export async function fetchCourse(slug: string) {
  const { data, error } = await supabase.from('academy_courses').select(COURSE).eq('slug', slug).maybeSingle()
  if (error) fail(error)
  return data ? sortEpisodes(data as unknown as Course) : null
}

export async function createCourse(input: { owner_id: string; title: string; category: string; description: string; teacher: string; cover_url: string }, episodes: Omit<Episode, 'id'>[]) {
  const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`
  const { data, error } = await supabase.from('academy_courses')
    .insert({ ...input, slug, lesson_count: episodes.length, published: false })
    .select('id, slug').single()
  if (error) fail(error)
  const { error: episodeError } = await supabase.from('academy_episodes').insert(episodes.map(episode => ({ ...episode, course_id: data.id })))
  if (episodeError) {
    await supabase.from('academy_courses').delete().eq('id', data.id)
    fail(episodeError)
  }
  // Publish only once every episode is in place.
  const { error: publishError } = await supabase.from('academy_courses').update({ published: true }).eq('id', data.id)
  if (publishError) fail(publishError)
  return data.slug as string
}

/** Reads an audio file's length in the browser before it uploads. */
export function audioDuration(file: File) {
  return new Promise<number>(resolve => {
    const url = URL.createObjectURL(file)
    const element = new Audio()
    element.preload = 'metadata'
    element.onloadedmetadata = () => { resolve(Number.isFinite(element.duration) ? Math.round(element.duration) : 0); URL.revokeObjectURL(url) }
    element.onerror = () => { resolve(0); URL.revokeObjectURL(url) }
    element.src = url
  })
}

/* ── Listening progress, saved to your account ── */

export type CourseProgress = { done: number[]; current: number; position: number }
const EMPTY: CourseProgress = { done: [], current: 1, position: 0 }
const EVENT = 'revival:academy'
const memory = new Map<string, CourseProgress>()

export async function fetchProgress(userId: string) {
  const { data, error } = await supabase.from('academy_progress').select('course_id, done, current, position').eq('user_id', userId)
  if (error) fail(error)
  for (const row of data ?? []) memory.set(row.course_id, { done: row.done ?? [], current: row.current ?? 1, position: row.position ?? 0 })
  window.dispatchEvent(new Event(EVENT))
}

let pending: number | undefined

export function saveProgress(userId: string | undefined, courseId: string, update: (current: CourseProgress) => CourseProgress, { immediate = false } = {}) {
  const next = update(memory.get(courseId) ?? EMPTY)
  memory.set(courseId, next)
  window.dispatchEvent(new Event(EVENT))
  if (!userId) return
  const write = () => supabase.from('academy_progress').upsert({ user_id: userId, course_id: courseId, ...next, updated_at: new Date().toISOString() }).then(() => undefined)
  // Position updates while listening are batched; finished episodes save straight away.
  window.clearTimeout(pending)
  if (immediate) void write()
  else pending = window.setTimeout(() => void write(), 4000)
}

/** Live progress for one course, shared by every component that shows it. */
export function useCourseProgress(courseId: string | undefined, userId: string | undefined) {
  const read = useCallback(() => (courseId ? memory.get(courseId) ?? EMPTY : EMPTY), [courseId])
  const [progress, setProgress] = useState(read)
  useEffect(() => {
    const sync = () => setProgress(read())
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [read])
  const markDone = useCallback((episode: number) => {
    if (!courseId) return
    saveProgress(userId, courseId, current => ({ ...current, position: 0, done: current.done.includes(episode) ? current.done : [...current.done, episode].sort((a, b) => a - b) }), { immediate: true })
  }, [courseId, userId])
  return { progress, markDone }
}

/** The first episode not yet finished, or the last one if all are done. */
export function nextEpisode(course: Pick<Course, 'episodes'>, progress: CourseProgress) {
  return course.episodes.find(episode => !progress.done.includes(episode.number))?.number ?? course.episodes.at(-1)?.number ?? 1
}

export const courseSeconds = (course: Pick<Course, 'episodes'>) => course.episodes.reduce((sum, episode) => sum + (episode.duration_seconds || 0), 0)

export function clock(total: number) {
  const value = Math.max(0, Math.floor(total))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

export function runtime(total: number) {
  if (!total) return 'Audio'
  if (total < 60) return `${total} sec`
  const minutes = Math.round(total / 60)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}
