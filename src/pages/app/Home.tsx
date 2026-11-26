import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarDays, ChevronRight, GraduationCap, HandHeart, Heart, MapPin, Sunrise, Users, Video } from '../../components/ui/icons'
import { Deck } from '../../components/ui/kit'
import { useAuth } from '../../lib/AuthContext'
import { EVENTS, PRAYERS, TODAYS_WORD } from '../../lib/content'

const PATHS = [
  { to: '/community#prayer-wall', label: 'Prayer wall', copy: 'Pray alongside the community', icon: HandHeart },
  { to: '/community#revival-cells', label: 'Revival cells', copy: 'Find a community near you', icon: Users },
  { to: '/events', label: 'Events', copy: 'Explore the next gatherings', icon: CalendarDays },
  { to: '/academy', label: 'Rev Academy', copy: 'Browse courses and learning paths', icon: GraduationCap },
]

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const { user, displayName } = useAuth()
  const firstName = user ? displayName.trim().split(/\s+/)[0] : ''
  const prayer = PRAYERS[2]
  const upcoming = EVENTS.slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="mb-4 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {greeting()}</p>
        <h1 className="font-heading text-[2.2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
          {firstName ? <>Welcome back, <span className="text-primary">{firstName}.</span></> : <>Welcome to <span className="text-primary">Revival One.</span></>}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">Make time for the Word, prayer and the people you are walking with.</p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Link to={`/word/${TODAYS_WORD.slug}`} className="bolt-card bolt-card--hover bolt-card--inset group relative flex min-h-[340px] overflow-hidden rounded-[28px] border border-white/10">
          <img src="/assets/revival-dawn.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[75%_50%] transition-transform duration-700 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
          <div className="relative flex flex-col justify-end p-7 sm:p-9">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><Sunrise className="h-4 w-4" /> Today’s Word · {TODAYS_WORD.reference}</p>
            <h2 className="mt-3 max-w-md font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">Strength for <span className="text-primary">the waiting.</span></h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">{TODAYS_WORD.summary}</p>
            <span className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Read the chapter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </div>
        </Link>

        <aside className="flex flex-col rounded-[28px] border border-white/[0.07] bg-surface-raised p-7">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><HandHeart className="h-5 w-5" /></span>
          <h2 className="mt-6 font-heading text-2xl font-semibold">Pray with someone today.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Take a moment to lift up a request from the community.</p>
          <div className="mt-6 rounded-[18px] border border-white/[0.07] bg-surface p-4">
            <p className="font-heading text-[15px] font-semibold">{prayer.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{prayer.text}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-primary"><Heart className="h-3.5 w-3.5" /> {prayer.praying} praying</p>
          </div>
          <Link to="/community#prayer-wall" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-primary transition-colors hover:text-primary/80">Visit the prayer wall <ChevronRight className="h-4 w-4" /></Link>
        </aside>
      </div>

      <section className="mt-12" aria-labelledby="next-step">
        <div className="flex items-end justify-between gap-4">
          <h2 id="next-step" className="font-heading text-2xl font-semibold">Your next step</h2>
        </div>
        <Deck className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PATHS.map(({ to, label, copy, icon: Icon }) => (
            <Link key={to} to={to} className="group flex min-h-[176px] flex-col rounded-[24px] border border-white/[0.07] bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="mt-auto pt-8 font-heading text-lg font-semibold">{label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </Link>
          ))}
        </Deck>
      </section>

      <section className="mt-12" aria-labelledby="coming-up">
        <div className="flex items-end justify-between gap-4">
          <h2 id="coming-up" className="font-heading text-2xl font-semibold">Coming up</h2>
          <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80">All events <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {upcoming.map(event => {
            const Place = event.online ? Video : MapPin
            return (
              <article key={event.title} className="flex gap-4 rounded-[22px] border border-white/[0.07] bg-surface p-5">
                <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 font-heading text-primary">
                  <span className="text-[10px] font-semibold uppercase">{event.date.split(' ')[0]}</span>
                  <span className="text-lg font-semibold leading-none">{event.date.split(' ')[1]}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{event.category}</p>
                  <h3 className="mt-1 truncate font-heading text-base font-semibold">{event.title}</h3>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><Place className="h-3.5 w-3.5" /> {event.place}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-12 flex flex-col items-start gap-5 rounded-[28px] border border-white/[0.07] bg-[linear-gradient(150deg,rgba(255,92,138,0.1),rgba(255,255,255,0.01))] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
          <div>
            <h2 className="font-heading text-xl font-semibold">Keep growing in Rev Academy</h2>
            <p className="mt-1 text-sm text-muted-foreground">Six courses in Scripture, prayer and leadership.</p>
          </div>
        </div>
        <Link to="/academy" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-surface px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 hover:bg-surface-raised">Browse courses <ArrowRight className="h-4 w-4 text-primary" /></Link>
      </section>
    </div>
  )
}
