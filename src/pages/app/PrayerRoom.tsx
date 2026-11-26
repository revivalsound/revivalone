import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Participant, Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client'
import { ArrowLeft, ArrowRight, Check, Clock, Copy, EndCall, HandHeart, Hourglass, Loader, Mic, Users } from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import { AuthorAvatar } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { api } from '../../lib/supabase'
import { countdown, fetchPrayerWall, formatClock, formatDay, normaliseWallCode, wallStatus, type PrayerWall } from '../../lib/community'

type Phase = 'loading' | 'missing' | 'error' | 'lobby' | 'connecting' | 'live' | 'left' | 'ended'

type Person = { id: string; name: string; avatar: string | null; host: boolean; speaking: boolean; muted: boolean; local: boolean }

function describe(participant: Participant, local: boolean): Person {
  let meta: { avatar_url?: string | null; host?: boolean } = {}
  try { meta = participant.metadata ? JSON.parse(participant.metadata) : {} } catch { /* not JSON */ }
  return {
    id: participant.identity,
    name: participant.name || 'Member',
    avatar: meta.avatar_url ?? null,
    host: Boolean(meta.host),
    speaking: participant.isSpeaking,
    muted: !participant.isMicrophoneEnabled,
    local,
  }
}

export default function PrayerRoom() {
  const { code: raw = '' } = useParams()
  const code = normaliseWallCode(raw) ?? ''
  const { session } = useAuth()
  const [wall, setWall] = useState<PrayerWall | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [micOn, setMicOn] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const [copied, setCopied] = useState(false)
  const room = useRef<Room | null>(null)
  const audio = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!code) { setPhase('missing'); return }
    fetchPrayerWall(code)
      .then(found => {
        if (!found) { setPhase('missing'); return }
        setWall(found)
        setPhase(wallStatus(found) === 'ended' ? 'ended' : 'lobby')
      })
      .catch(caught => { setError(caught instanceof Error ? caught.message : 'We couldn’t open this prayer wall.'); setPhase('error') })
  }, [code])

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  const refresh = useCallback(() => {
    const current = room.current
    if (!current) return
    setPeople([
      describe(current.localParticipant, true),
      ...[...current.remoteParticipants.values()].map(participant => describe(participant, false)),
    ])
    setMicOn(current.localParticipant.isMicrophoneEnabled)
  }, [])

  const leave = useCallback(async (next: Phase = 'left') => {
    const current = room.current
    room.current = null
    if (current) await current.disconnect()
    if (audio.current) audio.current.innerHTML = ''
    setPeople([])
    setPhase(next)
  }, [])

  // Close the room when the wall's time frame ends.
  useEffect(() => {
    if (!wall) return
    if (now >= new Date(wall.ends_at).getTime() && phase !== 'ended' && phase !== 'loading') void leave('ended')
  }, [now, wall, phase, leave])

  useEffect(() => () => { void room.current?.disconnect() }, [])

  async function join() {
    if (!session || !wall) return
    setPhase('connecting'); setError('')
    try {
      const { token, url } = await api<{ token: string; url: string }>('prayer-token', { method: 'POST', token: session.access_token, body: JSON.stringify({ code: wall.code }) })
      const next = new Room({ adaptiveStream: true, dynacast: true, audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      next
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Audio && audio.current) audio.current.appendChild(track.attach())
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => { track.detach().forEach(element => element.remove()) })
        .on(RoomEvent.ParticipantConnected, refresh)
        .on(RoomEvent.ParticipantDisconnected, refresh)
        .on(RoomEvent.ActiveSpeakersChanged, refresh)
        .on(RoomEvent.TrackMuted, refresh)
        .on(RoomEvent.TrackUnmuted, refresh)
        .on(RoomEvent.LocalTrackPublished, refresh)
        .on(RoomEvent.Disconnected, () => { if (room.current === next) { room.current = null; setPhase('left') } })
      await next.connect(url, token)
      room.current = next
      await next.startAudio()
      await next.localParticipant.setMicrophoneEnabled(micOn).catch(() => {
        setError('We couldn’t use your microphone. You can still listen; allow microphone access to pray aloud.')
      })
      refresh()
      setPhase('live')
    } catch (caught) {
      const body = (caught as { body?: { configured?: boolean } }).body
      setError(body?.configured === false
        ? 'Live prayer isn’t connected yet. An admin needs to add the LiveKit keys (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET) in Vercel.'
        : caught instanceof Error ? caught.message : 'We couldn’t connect you to the prayer wall.')
      setPhase('lobby')
    }
  }

  async function toggleMic() {
    const current = room.current
    if (!current) { setMicOn(value => !value); return }
    try {
      await current.localParticipant.setMicrophoneEnabled(!current.localParticipant.isMicrophoneEnabled)
      refresh()
    } catch {
      setError('We couldn’t use your microphone. Check your browser permissions.')
    }
  }

  function copyInvite() {
    void navigator.clipboard.writeText(`${window.location.origin}/prayer/${code}`).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800) })
  }

  if (phase === 'loading') {
    return <div className="flex min-h-[60vh] items-center justify-center"><span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-surface"><HandHeart className="h-6 w-6 text-primary" /></span></div>
  }
  if (phase === 'missing' || phase === 'error' || !wall) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-heading text-3xl font-semibold">{phase === 'missing' ? 'We couldn’t find that prayer wall' : 'Something went wrong'}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{phase === 'missing' ? 'Check the code, or ask the host for a new invite link.' : error}</p>
        <Link to="/community/prayer" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Prayer walls</Link>
      </div>
    )
  }

  const status = wallStatus(wall, now)
  const start = new Date(wall.starts_at).getTime()
  const end = new Date(wall.ends_at).getTime()
  const progress = Math.min(1, Math.max(0, (now - start) / (end - start)))
  const doorsOpen = status === 'live' || status === 'opening'
  const speaking = people.filter(person => person.speaking)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div ref={audio} hidden />
      <Link to="/community/prayer" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Prayer walls</Link>

      <section className="relative mt-5 overflow-hidden rounded-[30px] border border-white/10">
        <div className="absolute inset-0 hero-field-fallback--deep" />
        <div className="absolute inset-0 hero-field-scrim--deep" />
        {phase === 'live' && <div className="hero-strike" />}
        <div className="relative p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            {phase === 'live' || status === 'live'
              ? <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live</span>
              : phase === 'ended' ? <span className="inline-flex h-7 items-center rounded-full border border-white/15 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">Ended</span>
              : <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80"><Clock className="h-3.5 w-3.5" /> Scheduled</span>}
            <button type="button" onClick={copyInvite} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-black/30 px-3 font-mono text-[11px] text-white/85 backdrop-blur-md hover:bg-black/45">{copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />} {code}</button>
          </div>
          <h1 className="mt-5 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.6rem]">{wall.title}</h1>
          {wall.purpose && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-white/75">{wall.purpose}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/75">
            <span className="flex items-center gap-2"><AuthorAvatar author={wall.host ?? null} size="h-6 w-6" text="text-[9px]" /> Hosted by {wall.host?.full_name || 'a member'}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDay(wall.starts_at)} · {formatClock(wall.starts_at)} – {formatClock(wall.ends_at)}</span>
            {status === 'live' && <span className="flex items-center gap-1.5 font-semibold text-white"><Hourglass className="h-3.5 w-3.5 text-primary" /> {countdown(end - now)} left</span>}
          </div>
          {status === 'live' && (
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Time frame used" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#ff5c8a] to-[#ffb36b] transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
      </section>

      {phase === 'live' ? (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4 text-primary" /> {people.length} praying{speaking.length ? ` · ${speaking.map(person => person.local ? 'You' : person.name.split(' ')[0]).join(', ')} speaking` : ''}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {people.map(person => (
              <div key={person.id} className={`bolt-card flex flex-col items-center rounded-[24px] border px-4 py-6 text-center transition-colors ${person.speaking ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-surface'}`}>
                <span className={`relative rounded-full ${person.speaking ? 'brand-ring brand-ring--on' : ''}`}>
                  <AuthorAvatar author={{ full_name: person.name, avatar_url: person.avatar }} size="h-20 w-20" text="text-xl" />
                  {person.muted && <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-[#2a1018] text-white/80"><MicOff /></span>}
                </span>
                <p className="mt-4 max-w-full truncate text-[13px] font-semibold">{person.local ? 'You' : person.name}</p>
                <p className="text-[11px] text-muted-foreground">{person.host ? 'Host' : person.speaking ? 'Speaking' : person.muted ? 'Listening' : 'Praying'}</p>
              </div>
            ))}
          </div>
          {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}

          <div className="sticky bottom-24 z-20 mx-auto mt-8 flex w-fit items-center gap-2 rounded-full border border-white/[0.1] glass glass-strong p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] lg:bottom-6">
            <button type="button" onClick={toggleMic} aria-pressed={micOn} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'} className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${micOn ? 'bg-white/[0.08] text-foreground hover:bg-white/[0.12]' : 'bg-white text-[#140609]'}`}>
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff large />}
            </button>
            <button type="button" onClick={copyInvite} className="inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[13px] font-semibold hover:bg-white/[0.12]">{copied ? <><Check className="h-4 w-4 text-primary" /> Copied</> : <><Copy className="h-4 w-4" /> Invite</>}</button>
            <button type="button" onClick={() => void leave()} className="inline-flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-[13px] font-semibold text-white hover:bg-red-500/90"><EndCall className="h-5 w-5" /> Leave</button>
          </div>
        </>
      ) : (
        <section className="mx-auto mt-8 max-w-lg rounded-[28px] border border-white/[0.08] bg-surface-raised p-7 text-center">
          {phase === 'ended' ? (
            <>
              <h2 className="font-heading text-2xl font-semibold">This prayer wall has ended</h2>
              <p className="mt-2 text-sm text-muted-foreground">Thank you for praying. Start a new one any time.</p>
              <Link to="/community/prayer" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Prayer walls <ArrowRight className="h-4 w-4" /></Link>
            </>
          ) : !doorsOpen ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Hourglass className="h-6 w-6" /></span>
              <h2 className="mt-5 font-heading text-2xl font-semibold">Opens in {countdown(start - 10 * 60_000 - now)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Doors open ten minutes before {formatClock(wall.starts_at)}. Keep this page open or come back with the code.</p>
              <button type="button" onClick={copyInvite} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] bg-surface px-5 text-sm font-semibold">{copied ? <><Check className="h-4 w-4 text-primary" /> Copied</> : <><Copy className="h-4 w-4 text-primary" /> Copy invite link</>}</button>
            </>
          ) : !session ? (
            <>
              <h2 className="font-heading text-2xl font-semibold">Sign in to join</h2>
              <p className="mt-2 text-sm text-muted-foreground">Prayer walls are open to Revival One members.</p>
              <Link to={`/auth?next=/prayer/${code}`} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Sign in <ArrowRight className="h-4 w-4" /></Link>
            </>
          ) : (
            <>
              <span className="brand-ring brand-ring--on mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface"><Mic className="h-7 w-7 text-primary" /></span>
              <h2 className="mt-5 font-heading text-2xl font-semibold">{phase === 'left' ? 'You left the prayer wall' : 'Ready to pray?'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">You’ll join by voice. Choose whether your microphone starts on.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button type="button" onClick={() => setMicOn(value => !value)} aria-pressed={micOn} className={`inline-flex h-12 items-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-colors ${micOn ? 'bg-white/[0.08] hover:bg-white/[0.12]' : 'bg-white text-[#140609]'}`}>
                  {micOn ? <><Mic className="h-4 w-4" /> Mic on</> : <><MicOff /> Mic off</>}
                </button>
                <button type="button" onClick={join} disabled={phase === 'connecting'} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_30px_rgba(255,92,138,0.3)] disabled:opacity-60">
                  {phase === 'connecting' ? <><Loader className="h-4 w-4 animate-spin" /> Joining…</> : <>{phase === 'left' ? 'Rejoin' : 'Join prayer wall'} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
              {error && <div className="mt-5 text-left"><Notice tone="error">{error}</Notice></div>}
            </>
          )}
        </section>
      )}
    </div>
  )
}

/** Solar has no muted microphone, so the mic gets a slash. */
function MicOff({ large = false }: { large?: boolean }) {
  return (
    <span className="relative inline-flex">
      <Mic className={large ? 'h-5 w-5' : 'h-4 w-4'} />
      <span className="absolute left-1/2 top-1/2 h-[2px] w-[120%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
    </span>
  )
}
