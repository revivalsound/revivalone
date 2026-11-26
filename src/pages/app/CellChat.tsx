import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Chat, Clock, Loader, LogOut, MapPin, Users, X } from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import { AuthorAvatar } from '../../components/posts/PostCard'
import { MediaCover } from '../../components/community/cards'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  cellFocuses, fetchInitiative, fetchMembers, fetchMessages, formatTime, isMember, joinCell, leaveCell, sendMessage, subscribeToCell,
  type CellDetails, type ChatAuthor, type ChatMessage, type Initiative,
} from '../../lib/community'

type Member = ChatAuthor & { role: string }

function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(Date.now() - 86_400_000)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
}

const clock = (iso: string) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

export default function CellChat() {
  const { id = '' } = useParams()
  const { user, session, displayName, avatarUrl } = useAuth()
  const [cell, setCell] = useState<Initiative<'cell'> | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [role, setRole] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  const authors = useRef(new Map<string, ChatAuthor>())

  // The cell itself.
  useEffect(() => {
    let live = true
    fetchInitiative(id)
      .then(found => {
        if (!live) return
        if (!found || found.kind !== 'cell') { setState('missing'); return }
        setCell(found as Initiative<'cell'>)
        setState('ready')
      })
      .catch(caught => { if (live) { setError(caught instanceof Error ? caught.message : 'We couldn’t open this cell.'); setState('error') } })
    return () => { live = false }
  }, [id])

  // Membership, members and messages.
  useEffect(() => {
    if (state !== 'ready' || !user) return
    let live = true
    isMember(id, user.id).then(found => live && setRole(found)).catch(caught => live && setError(caught.message))
    fetchMembers(id).then(list => {
      if (!live) return
      setMembers(list)
      list.forEach(member => authors.current.set(member.id, member))
    }).catch(() => undefined)
    return () => { live = false }
  }, [state, user, id])

  useEffect(() => {
    if (!role || !user) return
    let live = true
    fetchMessages(id).then(list => {
      if (!live) return
      list.forEach(message => message.author && authors.current.set(message.author_id, message.author))
      setMessages(list)
    }).catch(caught => live && setError(caught.message))

    const channel = subscribeToCell(id, async incoming => {
      let author = authors.current.get(incoming.author_id) ?? null
      if (!author) {
        const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', incoming.author_id).maybeSingle()
        author = (data as ChatAuthor | null) ?? null
        if (author) authors.current.set(author.id, author)
      }
      setMessages(current => {
        if (current.some(message => message.id === incoming.id)) return current
        // Replace our own optimistic copy if this is it.
        const pending = current.findIndex(message => message.pending && message.author_id === incoming.author_id && message.body === incoming.body)
        const next = [...current]
        if (pending >= 0) next.splice(pending, 1)
        return [...next, { ...incoming, author }]
      })
    })
    return () => { live = false; void supabase.removeChannel(channel) }
  }, [id, role, user])

  // Stay pinned to the newest message.
  useEffect(() => {
    const node = list.current
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: messages.length > 1 ? 'smooth' : 'auto' })
  }, [messages.length])

  async function join() {
    if (!user) return
    setBusy(true); setError('')
    try {
      await joinCell(id, user.id)
      setRole('member')
      setMembers(current => current.some(member => member.id === user.id) ? current : [...current, { id: user.id, full_name: displayName, avatar_url: avatarUrl, role: 'member' }])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t add you to this cell.')
    } finally {
      setBusy(false)
    }
  }

  async function leave() {
    if (!user || role === 'leader') return
    setBusy(true)
    try {
      await leaveCell(id, user.id)
      setRole(null); setMessages([])
      setMembers(current => current.filter(member => member.id !== user.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t remove you from this cell.')
    } finally {
      setBusy(false)
    }
  }

  async function send(event?: FormEvent) {
    event?.preventDefault()
    const body = draft.trim()
    if (!body || !user) return
    setDraft('')
    const optimistic: ChatMessage = { id: `pending-${Date.now()}`, cell_id: id, author_id: user.id, body, created_at: new Date().toISOString(), author: { id: user.id, full_name: displayName, avatar_url: avatarUrl }, pending: true }
    setMessages(current => [...current, optimistic])
    try {
      const saved = await sendMessage(id, body)
      setMessages(current => {
        const withoutCopy = current.filter(message => message.id !== optimistic.id)
        return withoutCopy.some(message => message.id === saved.id) ? withoutCopy : [...withoutCopy, saved]
      })
    } catch (caught) {
      setMessages(current => current.filter(message => message.id !== optimistic.id))
      setDraft(body)
      setError(caught instanceof Error ? caught.message : 'Your message didn’t send.')
    }
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() }
  }

  const details = (cell?.details ?? {}) as Partial<CellDetails>
  const schedule = [details.meeting_day && `${details.meeting_day}s`, formatTime(details.start_time)].filter(Boolean).join(' · ')
  const place = details.format === 'online' ? 'Online' : [details.area, cell?.city].filter(Boolean).join(', ')

  // Group messages by day, and run consecutive messages from one person together.
  const rows = useMemo(() => messages.map((message, index) => {
    const previous = messages[index - 1]
    const newDay = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString()
    const continued = !newDay && previous.author_id === message.author_id && new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() < 5 * 60_000
    return { message, newDay, continued }
  }), [messages])

  if (state === 'loading') {
    return <div className="flex min-h-[60vh] items-center justify-center"><span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-surface"><img src="/assets/revival-flame-mark.png" alt="" className="h-7 w-7" /></span></div>
  }
  if (state !== 'ready' || !cell) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-heading text-3xl font-semibold">{state === 'missing' ? 'We couldn’t find this cell' : 'Something went wrong'}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{state === 'missing' ? 'It may have closed or moved.' : error}</p>
        <Link to="/community/cells" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"><ArrowLeft className="h-4 w-4" /> All cells</Link>
      </div>
    )
  }

  const info = (
    <div className="space-y-5">
      <MediaCover initiative={cell} className="h-32 rounded-[20px]" />
      <div>
        <h2 className="font-heading text-lg font-semibold">{cell.title}</h2>
        {cellFocuses(details).length > 0 && <div className="mt-2 flex flex-wrap gap-1">{cellFocuses(details).map(item => <span key={item} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{item}</span>)}</div>}
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{cell.description}</p>
      </div>
      <div className="space-y-2 rounded-[18px] border border-white/[0.07] bg-surface p-4 text-xs text-muted-foreground">
        {place && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {place}</p>}
        {schedule && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {schedule}</p>}
        <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {members.length || cell.member_count || 0} members{details.max_members ? ` of ${details.max_members}` : ''}</p>
      </div>
      {members.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Members</p>
          <ul className="mt-3 space-y-2.5">
            {members.map(member => (
              <li key={member.id}>
                <Link to={`/u/${member.id}`} className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-white/[0.04]">
                  <AuthorAvatar author={member} size="h-8 w-8" text="text-[10px]" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{member.full_name || 'Member'}{member.id === user?.id ? ' (you)' : ''}</span>
                  {member.role !== 'member' && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">{member.role}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {role && role !== 'leader' && (
        <button type="button" onClick={leave} disabled={busy} className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-red-300 transition-colors hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Leave this cell</button>
      )}
    </div>
  )

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem-5.75rem)] max-w-6xl gap-5 px-0 sm:px-6 sm:py-5 lg:h-[calc(100dvh-3.5rem)]">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden border-white/[0.07] bg-[#0b0708]/80 sm:rounded-[28px] sm:border" aria-label={`${cell.title} group chat`}>
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
          <Link to="/community/cells" aria-label="All cells" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <MediaCover initiative={cell} className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-[15px] font-semibold">{cell.title}</h1>
            <p className="truncate text-[11px] text-muted-foreground">{members.length || cell.member_count || 0} members{schedule ? ` · meets ${schedule}` : ''}</p>
          </div>
          <button type="button" onClick={() => setShowInfo(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.09] px-3 text-xs font-semibold text-foreground/85 transition-colors hover:bg-white/[0.06] lg:hidden"><Users className="h-4 w-4 text-primary" /> Info</button>
        </header>

        {!session ? (
          <Gate title="Sign in to join the conversation" copy="Cell chats are for members. Sign in, then join this cell to talk with the group.">
            <Link to={`/auth?next=/community/cells/${id}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </Gate>
        ) : !role ? (
          <Gate title={`Join ${cell.title}`} copy="Join this cell to read the group chat, share prayer requests and keep up with meetings.">
            <button type="button" onClick={join} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? <Loader className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Join this cell</button>
            {error && <div className="mt-4 max-w-sm text-left"><Notice tone="error">{error}</Notice></div>}
          </Gate>
        ) : (
          <>
            <div ref={list} className="flex-1 overflow-y-auto px-3 py-5 sm:px-6" aria-live="polite">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Chat className="h-6 w-6" /></span>
                  <p className="mt-4 font-heading text-lg font-semibold">Start the conversation</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">Say hello, share a prayer request or a word for the group.</p>
                </div>
              )}
              {rows.map(({ message, newDay, continued }) => {
                const mine = message.author_id === user?.id
                const author = message.author ?? authors.current.get(message.author_id) ?? null
                return (
                  <Fragment key={message.id}>
                    {newDay && (
                      <div className="my-5 flex items-center gap-3 first:mt-0">
                        <span className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{dayLabel(message.created_at)}</span>
                        <span className="h-px flex-1 bg-white/[0.06]" />
                      </div>
                    )}
                    <div className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${continued ? 'mt-1' : 'mt-4'}`}>
                      {!mine && (continued ? <span className="w-8 shrink-0" /> : <Link to={`/u/${message.author_id}`} className="shrink-0"><AuthorAvatar author={author} size="h-8 w-8" text="text-[10px]" /></Link>)}
                      <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        {!mine && !continued && <span className="mb-1 ml-1 text-[11px] font-semibold text-foreground/80">{author?.full_name || 'Member'}</span>}
                        <div className={`whitespace-pre-wrap break-words px-4 py-2.5 text-[14px] leading-6 ${mine
                          ? `rounded-[20px] rounded-br-md bg-gradient-to-br from-[#ff6b95] to-[#e11d5c] text-white shadow-[0_8px_24px_rgba(255,92,138,0.18)] ${message.pending ? 'opacity-70' : ''}`
                          : 'rounded-[20px] rounded-bl-md border border-white/[0.06] bg-surface-raised text-foreground/90'}`}>
                          {message.body}
                        </div>
                        <span className="mx-1 mt-1 text-[10px] text-muted-foreground/70">{message.pending ? 'Sending…' : clock(message.created_at)}</span>
                      </div>
                    </div>
                  </Fragment>
                )
              })}
            </div>

            <form onSubmit={send} className="border-t border-white/[0.07] p-3 sm:p-4">
              {error && <div className="mb-3"><Notice tone="error">{error}</Notice></div>}
              <div className="flex items-end gap-2 rounded-[22px] border border-white/[0.09] bg-white/[0.03] p-1.5 pl-4 transition-colors focus-within:border-primary/45">
                <textarea
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={onKey}
                  rows={1}
                  maxLength={2000}
                  placeholder={`Message ${cell.title}`}
                  aria-label="Message"
                  className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground/60"
                />
                <button type="submit" disabled={!draft.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"><ArrowRight className="h-4 w-4 -rotate-45" strokeWidth={2.4} /></button>
              </div>
              <p className="mt-1.5 hidden px-2 text-[10px] text-muted-foreground/60 sm:block">Enter to send · Shift + Enter for a new line</p>
            </form>
          </>
        )}
      </section>

      <aside className="hidden w-[300px] shrink-0 overflow-y-auto rounded-[28px] border border-white/[0.07] bg-surface-raised/70 p-5 lg:block">{info}</aside>

      {showInfo && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setShowInfo(false)}>
          <div className="dialog-in h-full w-[88%] max-w-sm overflow-y-auto border-l border-white/[0.08] bg-[#0f0b0c] p-5" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={() => setShowInfo(false)} aria-label="Close" className="mb-4 ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground"><X className="h-4 w-4" /></button>
            {info}
          </div>
        </div>
      )}
    </div>
  )
}

function Gate({ title, copy, children }: { title: string; copy: string; children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* A blurred suggestion of a conversation behind the gate */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 px-8 opacity-40 blur-[6px]">
        {[60, 42, 70, 38, 55].map((width, index) => (
          <span key={index} className={`h-10 rounded-[20px] ${index % 2 ? 'self-end bg-primary/40' : 'bg-white/[0.08]'}`} style={{ width: `${width}%` }} />
        ))}
      </div>
      <div className="relative max-w-sm rounded-[26px] border border-white/[0.09] glass glass-strong p-7 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <span className="brand-ring brand-ring--on mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface"><Chat className="h-6 w-6 text-primary" /></span>
        <h2 className="mt-5 font-heading text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
        <div className="mt-6 flex flex-col items-center">{children}</div>
      </div>
    </div>
  )
}
