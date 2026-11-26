import { supabase } from './supabase'

/** Thrown when supabase/bible.sql hasn't been run yet. */
export class ReadingNotReady extends Error {
  constructor() { super('Saving isn’t switched on yet. Run supabase/bible.sql in Supabase to turn it on.') }
}

function fail(error: { code?: string; message: string }): never {
  if (['PGRST205', '42P01', '42703', 'PGRST204'].includes(error.code ?? '')) throw new ReadingNotReady()
  throw new Error(error.message)
}

/* ── Highlights and verse notes ── */

export type HighlightColor = 'pink' | 'gold' | 'lilac' | 'sky'
export type Highlight = { book: string; chapter: number; verse: number; color: HighlightColor | 'none'; note: string }

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; swatch: string; wash: string }[] = [
  { id: 'pink', label: 'Pink', swatch: '#ff5c8a', wash: 'rgba(255, 92, 138, 0.22)' },
  { id: 'gold', label: 'Gold', swatch: '#ffd479', wash: 'rgba(255, 212, 121, 0.2)' },
  { id: 'lilac', label: 'Lilac', swatch: '#d7b8ff', wash: 'rgba(215, 184, 255, 0.2)' },
  { id: 'sky', label: 'Sky', swatch: '#8fd3ff', wash: 'rgba(143, 211, 255, 0.18)' },
]

export async function fetchHighlights(userId: string, book: string, chapter: number) {
  const { data, error } = await supabase.from('bible_highlights').select('book, chapter, verse, color, note').eq('user_id', userId).eq('book', book).eq('chapter', chapter)
  if (error) fail(error)
  return (data ?? []) as Highlight[]
}

export async function fetchAllHighlights(userId: string) {
  const { data, error } = await supabase.from('bible_highlights').select('book, chapter, verse, color, note, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(500)
  if (error) fail(error)
  return (data ?? []) as (Highlight & { updated_at: string })[]
}

export async function saveHighlights(userId: string, rows: Highlight[]) {
  const { error } = await supabase.from('bible_highlights').upsert(rows.map(row => ({ ...row, user_id: userId, updated_at: new Date().toISOString() })))
  if (error) fail(error)
}

export async function removeHighlights(userId: string, book: string, chapter: number, verses: number[]) {
  const { error } = await supabase.from('bible_highlights').delete().eq('user_id', userId).eq('book', book).eq('chapter', chapter).in('verse', verses)
  if (error) fail(error)
}

/* ── Daily guide progress ── */

export type GuideProgress = { year: number; day: number; readings: string[]; completed_at: string | null; reflection: string; prayer: string }

export async function fetchGuideYear(userId: string, year: number) {
  const { data, error } = await supabase.from('guide_progress').select('year, day, readings, completed_at, reflection, prayer').eq('user_id', userId).eq('year', year)
  if (error) fail(error)
  return (data ?? []) as GuideProgress[]
}

export async function saveGuideDay(userId: string, entry: GuideProgress) {
  const { error } = await supabase.from('guide_progress').upsert({ ...entry, user_id: userId, updated_at: new Date().toISOString() })
  if (error) fail(error)
}

/** Consecutive finished days, counting back from today (or yesterday, if today isn't done yet). */
export function streak(entries: GuideProgress[], today: number) {
  const done = new Set(entries.filter(entry => entry.completed_at).map(entry => entry.day))
  let day = done.has(today) ? today : today - 1
  let count = 0
  while (day >= 1 && done.has(day)) { count += 1; day -= 1 }
  return count
}

/* ── Where you left off (this device) ── */

const LAST_KEY = 'revival.bible.last'
export type LastRead = { translation: string; book: string; chapter: number }

export function readLast(): LastRead | null {
  try { return JSON.parse(window.localStorage.getItem(LAST_KEY) || 'null') } catch { return null }
}

export function writeLast(value: LastRead) {
  try { window.localStorage.setItem(LAST_KEY, JSON.stringify(value)) } catch { /* storage unavailable */ }
}

const PREFS_KEY = 'revival.bible.prefs'
export type ReaderPrefs = { size: number; redLetters: boolean; verseNumbers: boolean; narrator: string }
const DEFAULT_PREFS: ReaderPrefs = { size: 19, redLetters: true, verseNumbers: true, narrator: 'souer' }

export function readPrefs(): ReaderPrefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}') } } catch { return DEFAULT_PREFS }
}

export function writePrefs(value: ReaderPrefs) {
  try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(value)) } catch { /* storage unavailable */ }
}
