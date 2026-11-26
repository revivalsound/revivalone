import { BIBLE_BOOKS, bookById, bookSlug, DEFAULT_TRANSLATION, type BibleBook } from './bible'
import { fetchPeople, type Person } from './social'
import type { MentionItem } from '../components/posts/MentionList'

/* ── Bible references: "john 3:16", "1 cor 13", "ps 23:1-3", "gen" ── */

const ABBREVIATIONS: Record<string, string> = {
  ps: 'PSA', psa: 'PSA', psalm: 'PSA', psalms: 'PSA', prov: 'PRO', pro: 'PRO', gen: 'GEN', ex: 'EXO', exo: 'EXO', lev: 'LEV', num: 'NUM', deut: 'DEU', dt: 'DEU',
  josh: 'JOS', judg: 'JDG', sam: '1SA', kgs: '1KI', chr: '1CH', neh: 'NEH', esth: 'EST', eccl: 'ECC', ecc: 'ECC', song: 'SNG', sos: 'SNG', isa: 'ISA', jer: 'JER',
  lam: 'LAM', ezek: 'EZK', dan: 'DAN', hos: 'HOS', obad: 'OBA', mic: 'MIC', nah: 'NAM', hab: 'HAB', zeph: 'ZEP', hag: 'HAG', zech: 'ZEC', mal: 'MAL',
  mt: 'MAT', matt: 'MAT', mk: 'MRK', mrk: 'MRK', lk: 'LUK', jn: 'JHN', jhn: 'JHN', rom: 'ROM', cor: '1CO', gal: 'GAL', eph: 'EPH', phil: 'PHP', php: 'PHP', col: 'COL',
  thess: '1TH', tim: '1TI', tit: 'TIT', phlm: 'PHM', heb: 'HEB', jas: 'JAS', pet: '1PE', jud: 'JUD', rev: 'REV',
}

function matchBooks(name: string): BibleBook[] {
  const clean = name.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const numbered = clean.match(/^([1-3])\s*(.*)$/)
  const prefix = numbered ? numbered[1] : ''
  const rest = numbered ? numbered[2] : clean
  const short = ABBREVIATIONS[rest]
  if (short) {
    const id = prefix ? `${prefix}${short.slice(1)}` : short
    const book = bookById(id) ?? bookById(short)
    if (book) return [book]
  }
  return BIBLE_BOOKS.filter(book => {
    const label = book.name.toLowerCase()
    return prefix ? label.startsWith(`${prefix} ${rest}`) : label.startsWith(rest) || label.replace(/^[1-3] /, '').startsWith(rest)
  }).slice(0, 5)
}

export type VerseRef = { book: string; chapter: number; verse?: number; endVerse?: number }

/** Reads a typed reference. Returns suggestions: exact when a chapter is given, else matching books. */
export function verseSuggestions(query: string): MentionItem[] {
  const text = query.trim()
  if (!text) return []
  const match = text.match(/^((?:[1-3]\s*)?[a-z][a-z.\s]*?)\s*(\d+)?(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/i)
  if (!match) return []
  const [, name, chapterText, verseText, endText] = match
  const books = matchBooks(name)
  return books.flatMap(book => {
    const chapter = chapterText ? Number(chapterText) : null
    if (chapter !== null && (chapter < 1 || chapter > book.chapters)) return []
    const ref: VerseRef = { book: book.id, chapter: chapter ?? 1, verse: verseText ? Number(verseText) : undefined, endVerse: endText ? Number(endText) : undefined }
    return [{ kind: 'verse' as const, id: encodeVerse(ref), label: verseLabel(ref), detail: chapter === null ? `${book.chapters} chapters · opens chapter 1` : `Open in the Bible · ${book.testament === 'OT' ? 'Old' : 'New'} Testament` }]
  }).slice(0, 5)
}

export function encodeVerse({ book, chapter, verse, endVerse }: VerseRef) {
  return `${book}.${chapter}${verse ? `.${verse}${endVerse && endVerse !== verse ? `-${endVerse}` : ''}` : ''}`
}

export function decodeVerse(id: string): VerseRef | null {
  const match = id.match(/^([1-3A-Z]{3})\.(\d+)(?:\.(\d+)(?:-(\d+))?)?$/)
  if (!match) return null
  return { book: match[1], chapter: Number(match[2]), verse: match[3] ? Number(match[3]) : undefined, endVerse: match[4] ? Number(match[4]) : undefined }
}

export function verseLabel(ref: VerseRef) {
  const name = bookById(ref.book)?.name ?? ref.book
  if (!ref.verse) return `${name} ${ref.chapter}`
  return `${name} ${ref.chapter}:${ref.verse}${ref.endVerse && ref.endVerse !== ref.verse ? `–${ref.endVerse}` : ''}`
}

export function verseHref(ref: VerseRef) {
  const book = bookById(ref.book)
  return `/bible/${DEFAULT_TRANSLATION}/${book ? bookSlug(book) : ref.book}/${ref.chapter}${ref.verse ? `#v${ref.verse}` : ''}`
}

/* ── People you follow ── */

let following: { me: string; people: Promise<Person[]> } | null = null

export function peopleYouFollow(me: string) {
  if (!following || following.me !== me) following = { me, people: fetchPeople(me, 'following').catch(() => []) }
  return following.people
}

export async function peopleSuggestions(me: string | undefined, query: string): Promise<MentionItem[]> {
  if (!me) return []
  const text = query.trim().toLowerCase()
  const people = await peopleYouFollow(me)
  return people
    .filter(person => !text || person.full_name.toLowerCase().split(/\s+/).some(part => part.startsWith(text)) || person.full_name.toLowerCase().includes(text))
    .slice(0, 6)
    .map(person => ({ kind: 'user' as const, id: person.id, label: person.full_name || 'Member', avatar: person.avatar_url, detail: [person.city, person.church].filter(Boolean).join(' · ') || 'You follow them' }))
}

/** Where a mention points: "user:<id>" → a profile, "verse:JHN.3.16" → the Bible reader. */
export function mentionHref(id: string) {
  const [kind, value] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)]
  if (kind === 'user') return `/u/${value}`
  if (kind === 'verse') { const ref = decodeVerse(value); return ref ? verseHref(ref) : '/bible' }
  return '#'
}

/** The people tagged in a post, from the editor's HTML. */
export function mentionedUsers(html: string) {
  return [...new Set([...html.matchAll(/data-mention-id="user:([0-9a-f-]{36})"/g)].map(match => match[1]))]
}
