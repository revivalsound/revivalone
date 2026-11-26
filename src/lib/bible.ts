/**
 * Bible data for Revival One, served by the Free Use Bible API
 * (https://bible.helloao.org, github.com/HelloAOLab/bible-api): 1000+ translations,
 * audio narration, Tyndale study notes, public-domain commentaries, cross
 * references and the verse-of-the-day dataset. No key needed.
 */
import { pickVerseOfTheDay, type ApiTranslationBookChapter, type ChapterContent, type ChapterVerse } from 'free-use-bible-api'
import { BIBLE_BOOKS, type BibleBook } from './bible-books.generated'

export { BIBLE_BOOKS, type BibleBook }
export type { ChapterContent, ChapterVerse }

const API = 'https://bible.helloao.org'

/* ── Translations ── */

export type Translation = { id: string; name: string; short: string; about: string }

/** Complete English Bibles (all 66 books) that are free to use. BSB is the default. */
export const TRANSLATIONS: Translation[] = [
  { id: 'BSB', short: 'BSB', name: 'Berean Standard Bible', about: 'Modern, accurate and readable. Has audio narration.' },
  { id: 'ENGWEBP', short: 'WEB', name: 'World English Bible', about: 'Modern English, based on the ASV.' },
  { id: 'eng_kjv', short: 'KJV', name: 'King James Version', about: 'The classic 1611 translation.' },
  { id: 'eng_asv', short: 'ASV', name: 'American Standard Version', about: 'A literal 1901 revision of the KJV.' },
  { id: 'eng_msb', short: 'MSB', name: 'Majority Standard Bible', about: 'The BSB, using the Majority Text of the New Testament.' },
  { id: 'eng_lsv', short: 'LSV', name: 'Literal Standard Version', about: 'Word-for-word modern English.' },
  { id: 'eng_ylt', short: 'YLT', name: 'Young’s Literal Translation', about: 'A strictly literal 1862 translation.' },
  { id: 'eng_bbe', short: 'BBE', name: 'Bible in Basic English', about: 'Simple English, about 1,000 words.' },
  { id: 'eng_gnv', short: 'GNV', name: 'Geneva Bible 1599', about: 'The Bible of the Reformation.' },
  { id: 'eng_dby', short: 'DBY', name: 'Darby Translation', about: 'A literal 19th-century translation.' },
]

export const DEFAULT_TRANSLATION = 'BSB'
export const translationById = (id: string) => TRANSLATIONS.find(item => item.id === id)

/* ── Books and references ── */

export const bookById = (id: string) => BIBLE_BOOKS.find(book => book.id === id.toUpperCase())

/** Matches "John", "john", "JHN", "1 John", "1-john" to a book. */
export function findBook(value: string) {
  const clean = value.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  return BIBLE_BOOKS.find(book => book.id.toLowerCase() === clean || book.name.toLowerCase() === clean)
}

export const bookSlug = (book: BibleBook) => book.name.toLowerCase().replace(/\s+/g, '-')

export type Reference = { book: string; chapter: number; verse?: number; endVerse?: number }

export function formatReference({ book, chapter, verse, endVerse }: Reference) {
  const name = bookById(book)?.name ?? book
  if (!verse) return `${name} ${chapter}`
  return `${name} ${chapter}:${verse}${endVerse && endVerse !== verse ? `–${endVerse}` : ''}`
}

/** Where a reference opens in the reader. */
export function readerPath(reference: Reference, translation = DEFAULT_TRANSLATION) {
  const book = bookById(reference.book)
  const base = `/bible/${translation}/${book ? bookSlug(book) : reference.book}/${reference.chapter}`
  return reference.verse ? `${base}#v${reference.verse}` : base
}

/* ── Requests (cached for the session) ── */

const cache = new Map<string, Promise<unknown>>()

function get<T>(path: string): Promise<T> {
  let request = cache.get(path) as Promise<T> | undefined
  if (!request) {
    request = fetch(`${API}${path}`).then(response => {
      if (!response.ok) throw new Error(response.status === 404 ? 'not-found' : `The Bible service returned ${response.status}.`)
      return response.json() as Promise<T>
    })
    request.catch(() => cache.delete(path))
    cache.set(path, request)
  }
  return request
}

export function fetchChapter(translation: string, book: string, chapter: number) {
  return get<ApiTranslationBookChapter>(`/api/${translation}/${book}/${chapter}.json`)
}

/** Tyndale Open Study Notes or a classic commentary for a chapter, keyed by verse. */
export type CommentaryNote = { verse: number; text: string }
export type CommentaryId = 'tyndale' | 'matthew-henry' | 'jamieson-fausset-brown'

export const COMMENTARIES: { id: CommentaryId; name: string }[] = [
  { id: 'tyndale', name: 'Tyndale study notes' },
  { id: 'matthew-henry', name: 'Matthew Henry' },
  { id: 'jamieson-fausset-brown', name: 'Jamieson-Fausset-Brown' },
]

export async function fetchCommentary(id: CommentaryId, book: string, chapter: number) {
  try {
    const data = await get<{ book?: { introduction?: string }; chapter: { introduction?: string; content: { type: string; number?: number; content?: unknown[] }[] } }>(`/api/c/${id}/${book}/${chapter}.json`)
    const notes: CommentaryNote[] = data.chapter.content
      .filter(item => item.type === 'verse' && item.number)
      .map(item => ({ verse: item.number!, text: (item.content ?? []).map(part => (typeof part === 'string' ? part : '')).join(' ').trim() }))
      .filter(note => note.text)
    return { introduction: data.chapter.introduction ?? '', bookIntroduction: data.book?.introduction ?? '', notes }
  } catch (error) {
    if (error instanceof Error && error.message === 'not-found') return { introduction: '', bookIntroduction: '', notes: [] }
    throw error
  }
}

export type CrossReference = { book: string; chapter: number; verse: number; endVerse?: number; score: number }

export async function fetchCrossReferences(book: string, chapter: number) {
  try {
    const data = await get<{ chapter: { content: { verse: number; references: CrossReference[] }[] } }>(`/api/d/open-cross-ref/${book}/${chapter}.json`)
    return new Map(data.chapter.content.map(item => [item.verse, item.references]))
  } catch {
    return new Map<number, CrossReference[]>()
  }
}

/* ── Text helpers ── */

type VerseParts = ChapterVerse['content']

/**
 * A verse's text comes in parts (split at footnotes and at the words of Jesus).
 * The API's simple format joins them with a space; this does the same, without
 * putting a space before closing punctuation.
 */
export function joinSpace(previous: string, next: string) {
  if (!previous || !next) return ''
  if (/\s$/.test(previous) || /^\s/.test(next)) return ''
  if (/^[,.;:!?’”)\]—–-]/.test(next)) return ''
  if (/[“‘(\[—–-]$/.test(previous)) return ''
  return ' '
}

/** Plain text of a verse (footnote markers and headings dropped). */
export function verseText(content: VerseParts) {
  let text = ''
  for (const part of content) {
    const piece = typeof part === 'string' ? part : 'text' in part ? part.text : 'lineBreak' in part ? ' ' : ''
    if (piece) text += joinSpace(text, piece) + piece
  }
  return text.replace(/\s+/g, ' ').trim()
}

/** The text of a verse or range, fetched from a chapter. */
export async function fetchPassageText(reference: Reference, translation = DEFAULT_TRANSLATION) {
  const data = await fetchChapter(translation, reference.book, reference.chapter)
  const first = reference.verse ?? 1
  const last = reference.endVerse ?? reference.verse ?? Number.MAX_SAFE_INTEGER
  return data.chapter.content
    .filter((item): item is ChapterContent & { type: 'verse' } => item.type === 'verse' && item.number >= first && item.number <= last)
    .map(item => verseText(item.content))
    .join(' ')
}

/* ── Verse of the day (the dataset's own convention, via the SDK) ── */

type VotdData = { verses: { book: string; chapter: number; verse: number; endVerse?: number; categories?: string[] }[]; holidays: { id: string; name?: string; month?: number; day?: number; dates?: string[] }[] }

export async function verseOfTheDay(date = new Date()): Promise<(Reference & { holiday?: string }) | null> {
  const data = await get<VotdData>('/api/d/verse-of-the-day/verses.json')
  const pick = pickVerseOfTheDay(data.verses, localDate(date), { holidays: data.holidays })
  if (!pick) return null
  const iso = localDate(date)
  const [, month, day] = iso.split('-').map(Number)
  const holiday = data.holidays.find(item => (item.month === month && item.day === day) || item.dates?.includes(iso))
  return { book: pick.book, chapter: pick.chapter, verse: pick.verse, endVerse: pick.endVerse, holiday: holiday && pick.categories?.includes(holiday.id) ? holiday.name : undefined }
}

/** The user's local calendar date as YYYY-MM-DD. */
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/* ── The daily Bible guide: the whole Bible from January to December ── */

/**
 * Three readings a day: the Old Testament (without Psalms and Proverbs), the New
 * Testament, and Psalms with Proverbs. Each track is spread evenly over 365 days,
 * so all 1,189 chapters are read once in the year.
 */
export type GuideReading = { track: 'ot' | 'nt' | 'wisdom'; book: string; from: number; to: number }
export type GuideDay = { day: number; readings: GuideReading[] }

export const GUIDE_DAYS = 365

const TRACKS: { track: GuideReading['track']; label: string; books: BibleBook[] }[] = [
  { track: 'ot', label: 'Old Testament', books: BIBLE_BOOKS.filter(book => book.testament === 'OT' && book.id !== 'PSA' && book.id !== 'PRO') },
  { track: 'nt', label: 'New Testament', books: BIBLE_BOOKS.filter(book => book.testament === 'NT') },
  { track: 'wisdom', label: 'Psalms & Proverbs', books: BIBLE_BOOKS.filter(book => book.id === 'PSA' || book.id === 'PRO') },
]

export const TRACK_LABEL = Object.fromEntries(TRACKS.map(track => [track.track, track.label])) as Record<GuideReading['track'], string>

const PLAN: GuideDay[] = (() => {
  const days: GuideDay[] = Array.from({ length: GUIDE_DAYS }, (_, index) => ({ day: index + 1, readings: [] }))
  for (const { track, books } of TRACKS) {
    const chapters = books.flatMap(book => Array.from({ length: book.chapters }, (_, index) => ({ book: book.id, chapter: index + 1 })))
    for (let index = 0; index < GUIDE_DAYS; index += 1) {
      const start = Math.floor((index * chapters.length) / GUIDE_DAYS)
      const end = Math.floor(((index + 1) * chapters.length) / GUIDE_DAYS)
      // Group the day's chapters into one reading per book.
      for (const item of chapters.slice(start, end)) {
        const last = days[index].readings.at(-1)
        if (last && last.track === track && last.book === item.book && last.to === item.chapter - 1) last.to = item.chapter
        else days[index].readings.push({ track, book: item.book, from: item.chapter, to: item.chapter })
      }
    }
  }
  return days
})()

export const guideDay = (day: number) => PLAN[Math.min(Math.max(day, 1), GUIDE_DAYS) - 1]

export const readingKey = (reading: GuideReading) => `${reading.book}.${reading.from}-${reading.to}`

export function readingLabel(reading: GuideReading) {
  const name = bookById(reading.book)?.name ?? reading.book
  return reading.from === reading.to ? `${name} ${reading.from}` : `${name} ${reading.from}–${reading.to}`
}

/** Guide day for a date. In a leap year, February 29 shares February 28’s readings. */
export function guideDayForDate(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  let day = Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - start.getTime()) / 86_400_000) + 1
  const leap = new Date(date.getFullYear(), 1, 29).getMonth() === 1
  if (leap && day >= 60) day -= 1
  return Math.min(day, GUIDE_DAYS)
}

/** The calendar date for a guide day in a year. */
export function dateForGuideDay(day: number, year = new Date().getFullYear()) {
  const leap = new Date(year, 1, 29).getMonth() === 1
  return new Date(year, 0, day + (leap && day >= 60 ? 1 : 0))
}
