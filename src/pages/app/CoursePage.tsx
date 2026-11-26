import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Back15, Check, Forward15, GraduationCap, Headphones, PauseCircle, Play, PlayCircle, Playlist, SkipNext, SkipPrevious, User } from '../../components/ui/icons'
import EpisodeDots from '../../components/academy/EpisodeDots'
import BrandMark from '../../components/brand/BrandMark'
import { audioFor, clock, courseBySlug, courseSeconds, episodeSeconds, nextEpisode, runtime, saveProgress, useCourseProgress } from '../../lib/academy'

const SPEEDS = [1, 1.25, 1.5, 2]

export default function CoursePage() {
  const { slug = '' } = useParams()
  const course = courseBySlug(slug)
  const { progress, markDone } = useCourseProgress(slug)
  const audio = useRef<HTMLAudioElement>(null)
  const [episode, setEpisode] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [justFinished, setJustFinished] = useState<number | null>(null)

  // Load the chosen episode and play it.
  useEffect(() => {
    const element = audio.current
    if (!element || episode === null) return
    element.src = audioFor(slug, episode)
    const resume = progress.current === episode ? progress.position : 0
    element.currentTime = resume
    element.playbackRate = speed
    void element.play().catch(() => setPlaying(false))
    saveProgress(slug, current => ({ ...current, current: episode }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode, slug])

  useEffect(() => { if (audio.current) audio.current.playbackRate = speed }, [speed])
  useEffect(() => () => audio.current?.pause(), [])

  if (!course) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-heading text-3xl font-semibold">We couldn’t find that course</h1>
        <Link to="/academy" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Rev Academy</Link>
      </div>
    )
  }

  const count = course.episodes.length
  const upNext = nextEpisode(course, progress)
  const finishedAll = progress.done.length === count
  const started = progress.done.length > 0 || progress.position > 0

  function play(number: number) {
    if (number === episode) { toggle(); return }
    setJustFinished(null)
    setEpisode(number)
  }

  function toggle() {
    const element = audio.current
    if (!element) return
    if (episode === null) { setEpisode(upNext); return }
    if (element.paused) void element.play()
    else element.pause()
  }

  function skip(by: number) {
    const element = audio.current
    if (element) element.currentTime = Math.min(Math.max(0, element.currentTime + by), element.duration || 0)
  }

  function ended() {
    if (episode === null) return
    markDone(episode)
    setJustFinished(episode)
    setPlaying(false)
    // Carry on to the next episode after a short pause.
    if (episode < count) window.setTimeout(() => setEpisode(current => (current === episode ? episode + 1 : current)), 1800)
  }

  const current = episode ? course.episodes[episode - 1] : null

  return (
    <div className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 ${episode ? 'pb-48 lg:pb-36' : ''}`}>
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={event => setDuration(event.currentTarget.duration)}
        onTimeUpdate={event => {
          setTime(event.currentTarget.currentTime)
          const position = event.currentTarget.currentTime
          if (episode && Math.floor(position) % 5 === 0) saveProgress(slug, value => ({ ...value, current: episode, position }))
        }}
        onEnded={ended}
      />

      <Link to="/academy" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Rev Academy</Link>

      <section className="mt-6 grid overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0b0607] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="p-7 sm:p-10">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary"><Headphones className="h-4 w-4" /> Audio course · {course.category}</p>
          <h1 className="mt-4 font-heading text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.2rem]">{course.title}</h1>
          <p className="mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">{course.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-primary" /> {course.teacher}</span>
            <span className="flex items-center gap-1.5"><Playlist className="h-4 w-4 text-primary" /> {count} episodes</span>
            <span className="flex items-center gap-1.5"><Headphones className="h-4 w-4 text-primary" /> {runtime(courseSeconds(slug))} total</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => (episode ? toggle() : setEpisode(finishedAll ? 1 : upNext))} className="group inline-flex h-14 items-center gap-3 rounded-full bg-primary pl-2 pr-7 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_16px_40px_rgba(255,92,138,0.35)] transition-all hover:-translate-y-0.5 active:scale-[0.98]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#070405] text-primary">{playing ? <PauseCircle className="h-5 w-5" /> : <Play className="h-5 w-5" />}</span>
              {playing ? 'Pause' : episode ? 'Resume' : finishedAll ? 'Listen again' : started ? `Continue · episode ${upNext}` : 'Start listening'}
            </button>
            <span className="text-xs text-muted-foreground">{progress.done.length} of {count} finished</span>
          </div>

          <div className="mt-6">
            <EpisodeDots count={count} progress={progress} size="h-9 w-9 text-xs" />
          </div>
        </div>
        <div className="relative hidden min-h-[320px] items-center justify-center overflow-hidden md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(176,32,79,0.5),transparent_75%)]" />
          <div className={`absolute inset-[12%] rounded-full border border-white/10 [border-style:dashed] ${playing ? '[animation:spin_12s_linear_infinite]' : ''}`} />
          <BrandMark size={150} />
          {playing && <Equalizer className="absolute bottom-10" />}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="episodes-heading">
        <h2 id="episodes-heading" className="font-heading text-2xl font-semibold">Episodes</h2>
        <ol className="mt-5 space-y-2.5">
          {course.episodes.map((item, index) => {
            const number = index + 1
            const done = progress.done.includes(number)
            const active = number === episode
            return (
              <li key={item.title}>
                <button type="button" onClick={() => play(number)} aria-current={active ? 'true' : undefined} className={`bolt-card group flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition-colors sm:p-5 ${active ? 'bolt-card--on border-transparent bg-surface-raised' : 'bolt-card--hover border-white/[0.07] bg-surface hover:bg-surface-raised'}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold transition-colors duration-500 ${done ? 'bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(255,92,138,0.35)]' : active ? 'border border-primary text-primary' : 'border border-white/[0.1] text-foreground/70'}`}>
                    {active && playing ? <Equalizer small /> : number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-[15px] font-semibold">{item.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">{item.summary}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{done ? <span className="inline-flex items-center gap-1 text-primary"><Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Finished</span> : clock(episodeSeconds(slug, number))}</span>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${active ? 'bg-primary text-primary-foreground' : 'border border-white/[0.08] text-foreground group-hover:border-primary/40 group-hover:text-primary'}`}>
                    {active && playing ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap className="h-4 w-4 text-primary" /> Progress is saved on this device. Finished episodes light up on the course card.</p>
      </section>

      {/* Player */}
      {episode && current && (
        <div className="dialog-in fixed inset-x-3 bottom-24 z-30 rounded-[24px] border border-white/[0.1] glass glass-strong p-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] sm:inset-x-6 lg:inset-x-auto lg:bottom-6 lg:right-8 lg:w-[660px]">
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ${playing ? 'brand-ring brand-ring--on' : ''}`}><BrandMark size={28} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{justFinished === episode ? 'Finished · ' : ''}Episode {episode} of {count}</p>
              <p className="truncate font-heading text-sm font-semibold">{current.title}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setEpisode(Math.max(1, episode - 1))} disabled={episode === 1} aria-label="Previous episode" className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30 sm:flex"><SkipPrevious className="h-5 w-5" /></button>
              <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds" className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><Back15 className="h-5 w-5" /></button>
              <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_22px_rgba(255,92,138,0.35)] active:scale-95">{playing ? <PauseCircle className="h-6 w-6" /> : <Play className="h-5 w-5" />}</button>
              <button type="button" onClick={() => skip(15)} aria-label="Forward 15 seconds" className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><Forward15 className="h-5 w-5" /></button>
              <button type="button" onClick={() => setEpisode(Math.min(count, episode + 1))} disabled={episode === count} aria-label="Next episode" className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30 sm:flex"><SkipNext className="h-5 w-5" /></button>
              <button type="button" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Playback speed" className="ml-1 hidden h-9 min-w-[3rem] items-center justify-center rounded-full border border-white/[0.1] px-2 text-xs font-semibold sm:flex">{speed}×</button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 px-1">
            <span className="w-9 text-right font-mono text-[10px] text-muted-foreground">{clock(time)}</span>
            <input
              type="range"
              min={0}
              max={duration || episodeSeconds(slug, episode) || 1}
              step={0.1}
              value={time}
              onChange={event => { if (audio.current) audio.current.currentTime = Number(event.target.value) }}
              aria-label="Seek"
              className="episode-seek h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
              style={{ backgroundImage: `linear-gradient(90deg, #ff5c8a ${(time / (duration || 1)) * 100}%, transparent 0)` }}
            />
            <span className="w-9 font-mono text-[10px] text-muted-foreground">{clock(duration || episodeSeconds(slug, episode))}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Equalizer({ small = false, className = '' }: { small?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`flex items-end gap-[3px] ${small ? 'h-4' : 'h-8'} ${className}`}>
      {[0, 1, 2, 3].map(bar => <span key={bar} className={`equalizer-bar ${small ? 'w-[3px]' : 'w-1.5'} rounded-full ${small ? 'bg-current' : 'bg-primary'}`} style={{ animationDelay: `${bar * 0.15}s` }} />)}
    </span>
  )
}
