import { useState, type ElementType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bible,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Fire,
  Globe,
  GraduationCap,
  HandHeart,
  HandShake,
  Heart,
  Home,
  MapPin,
  MusicNote,
  PanelLeft,
  PeopleNearby,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Target,
  UserHands,
  Users,
  Video,
  Zap,
} from '../components/ui/icons'
import BrandMark from '../components/brand/BrandMark'
import HeroField from '../components/HeroField'
import { useCardDeck } from '../components/landing/useCardDeck'
import { BoltDisclosure, Deck, Eyebrow, HeadlineChip, PrimaryPill, SecondaryPill } from '../components/ui/kit'
import { COURSES, TODAYS_WORD } from '../lib/content'
import { useAuth } from '../lib/AuthContext'

/* ── Hero mockup: a faithful miniature of the real Revival One app (icon rail, home) ── */

function MockRailIcon({ icon: Icon, active, badge }: { icon: ElementType; active?: boolean; badge?: string }) {
  return (
    <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#1a0610] text-primary ring-2 ring-primary shadow-[0_6px_16px_rgba(255,92,138,0.25)]' : 'border border-white/[0.07] bg-white/[0.03] text-muted-foreground'}`}>
      <Icon className="h-3 w-3" />
      {badge ? <span className="absolute -right-0.5 -top-0.5 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-primary px-0.5 text-[6px] font-bold text-primary-foreground ring-1 ring-[#0a0607]">{badge}</span> : null}
    </span>
  )
}

function AppMockup() {
  return (
    <div className="relative mx-auto mt-4 overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#0a0607] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
      <div className="flex h-[440px] select-none sm:h-[500px]" aria-hidden="true">
        <div className="hidden w-12 shrink-0 flex-col items-center border-r border-white/[0.06] bg-[#0a0607] py-3 sm:flex">
          <img src="/assets/revival-flame-mark.png" alt="" className="mb-3 h-6 w-6 object-contain" />
          <div className="flex flex-1 flex-col items-center gap-2 py-1">
            <MockRailIcon icon={Home} active />
            <MockRailIcon icon={Users} badge="3" />
            <MockRailIcon icon={CalendarDays} />
            <MockRailIcon icon={GraduationCap} />
            <MockRailIcon icon={Bible} />
          </div>
          <div className="flex flex-col items-center gap-2 border-t border-white/[0.06] pt-2">
            <MockRailIcon icon={Plus} />
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
            <div className="flex items-center gap-2 text-[10px]">
              <PanelLeft className="h-3 w-3 text-muted-foreground" />
              <span className="hidden text-muted-foreground sm:inline">Revival One</span>
              <span className="hidden text-muted-foreground/30 sm:inline">/</span>
              <span className="font-semibold text-foreground">Home</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground sm:flex"><Search className="h-2.5 w-2.5" /></span>
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-primary px-2 text-[8px] font-bold text-primary-foreground"><BookOpen className="h-2.5 w-2.5" /> Today’s Word</span>
              <Bell className="hidden h-3 w-3 text-muted-foreground sm:block" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ff5c8a] to-[#e11d5c] text-[8px] font-bold text-primary-foreground">AO</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-3 pt-4 sm:px-6">
            <p className="font-heading text-lg font-semibold leading-tight sm:text-xl">Welcome back, <span className="text-primary">Ada.</span></p>
            <div className="grid gap-2.5 sm:grid-cols-[1.4fr_1fr]">
              <div className="relative overflow-hidden rounded-[16px] border border-white/10">
                <img src="/assets/revival-dawn.webp" alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
                <div className="relative p-3.5 sm:p-4">
                  <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-primary"><BookOpen className="h-2.5 w-2.5" /> Today’s Word · Isaiah 40:31</p>
                  <p className="mt-2 font-heading text-[15px] font-semibold leading-tight">Strength for the waiting.</p>
                  <p className="mt-1 max-w-[12rem] text-[9px] leading-4 text-white/70">Find renewed strength when the road ahead feels long.</p>
                  <span className="mt-3 inline-flex h-5 items-center gap-1 rounded-full bg-primary px-2 text-[8px] font-bold text-primary-foreground">Read the chapter <ArrowRight className="h-2.5 w-2.5" /></span>
                </div>
              </div>
              <div className="rounded-[16px] border border-white/[0.07] bg-surface-raised p-3.5">
                <HandHeart className="h-4 w-4 text-primary" />
                <p className="mt-2 font-heading text-[12px] font-semibold">Pray with someone today.</p>
                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">214 people are praying for healing.</p>
                <span className="mt-2.5 inline-flex h-5 items-center gap-1 rounded-full border border-white/[0.1] px-2 text-[8px] font-semibold text-foreground/85"><Heart className="h-2.5 w-2.5 text-primary" /> I’m praying</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[[Users, 'Revival cells', '5 near you'], [CalendarDays, 'Events', 'Fire Prayer · Tue'], [GraduationCap, 'Rev Academy', '6 courses'], [HandHeart, 'Prayer wall', '4 requests']].map(([Icon, title, copy]) => {
                const I = Icon as ElementType
                return (
                  <div key={String(title)} className="rounded-[14px] border border-white/[0.07] bg-surface p-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><I className="h-3 w-3" /></span>
                    <p className="mt-2 text-[9px] font-semibold">{String(title)}</p>
                    <p className="text-[8px] text-muted-foreground">{String(copy)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Hero ribbon: small, real pieces of the Revival One app ── */

function RibbonPhoto({ src, label, position = 'center' }: { src: string; label?: string; position?: string }) {
  return (
    <div className="relative h-[176px] w-[140px] overflow-hidden rounded-[18px] border border-white/25 bg-[#1a0610] shadow-[0_24px_50px_rgba(25,2,12,0.45)]">
      <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: position }} loading="lazy" />
      {label && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[9px] font-bold text-primary backdrop-blur-sm">
          <BookOpen className="h-2.5 w-2.5" /> {label}
        </span>
      )}
    </div>
  )
}

function RibbonCard({ children, tone = 'light', className = '' }: { children: ReactNode; tone?: 'light' | 'dark' | 'rose'; className?: string }) {
  const tones = {
    light: 'border-white/70 bg-[#fbf3f0] text-[#1d0a10]',
    dark: 'border-white/15 bg-[#12070b] text-white',
    rose: 'border-white/40 bg-primary text-primary-foreground',
  }
  return <div className={`w-[168px] rounded-[18px] border p-3.5 text-left shadow-[0_24px_50px_rgba(25,2,12,0.4)] ${tones[tone]} ${className}`}>{children}</div>
}

const ribbon: ReactNode[] = [
  <RibbonPhoto key="dawn-a" src="/assets/revival-dawn.webp" position="85% 50%" />,
  <RibbonCard key="prayer">
    <p className="flex items-center gap-1.5 text-[10px] font-semibold"><HandHeart className="h-3 w-3 text-[#e11d5c]" /> Prayer wall</p>
    <p className="mt-2 rounded-lg bg-black/[0.05] px-2 py-1.5 text-[10px] font-medium leading-4">Courage to share the Gospel this week</p>
    <div className="mt-2 flex overflow-hidden rounded-full border border-black/10 text-[9px] font-semibold">
      <span className="flex-1 px-2 py-1 text-center text-black/40">128</span>
      <span className="flex-1 bg-[#1d0a10] px-2 py-1 text-center text-primary">Praying</span>
    </div>
  </RibbonCard>,
  <RibbonCard key="event" tone="dark" className="w-[180px]">
    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Worship night</p>
    <p className="mt-1.5 font-heading text-[15px] font-semibold leading-tight">The Upper Room</p>
    <p className="mt-1 flex items-center gap-1 text-[9px] text-white/55"><MapPin className="h-2.5 w-2.5" /> Civic Centre · Lagos</p>
    <div className="mt-3 flex items-center justify-between">
      <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-semibold">Dec 13</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[9px] font-bold text-primary-foreground"><Zap className="h-2.5 w-2.5" /> I’ll be there</span>
    </div>
  </RibbonCard>,
  <RibbonCard key="cells" tone="dark" className="w-[196px]">
    <p className="font-heading text-[13px] font-semibold">Revival cells</p>
    <p className="mt-0.5 text-[9px] text-white/55">5 communities near you</p>
    <div className="mt-3 space-y-1.5">
      {[['Victoria Island', 'Thu'], ['Lekki Phase 1', 'Sat'], ['Yaba Central', 'Fri']].map(([name, day]) => (
        <div key={name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[9px]">
          <span className="font-medium">{name}</span>
          <span className="font-bold text-primary">{day}</span>
        </div>
      ))}
    </div>
  </RibbonCard>,
  <RibbonPhoto key="word" src="/assets/revival-dawn.webp" position="72% 70%" label="Isaiah 40:31" />,
  <RibbonCard key="academy">
    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#e11d5c]">Rev Academy</p>
    <p className="mt-1.5 font-heading text-[14px] font-semibold leading-tight">Built in the Secret Place</p>
    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/10"><span className="block h-full w-[62%] rounded-full bg-[#e11d5c]" /></div>
    <p className="mt-1.5 text-[10px] font-medium">Lesson 5 of 8</p>
  </RibbonCard>,
  <RibbonCard key="together" tone="rose">
    <p className="text-[9px] font-bold uppercase tracking-[0.12em] opacity-70">This week</p>
    <p className="mt-1.5 font-heading text-2xl font-semibold">492</p>
    <p className="text-[10px] font-medium">prayers lifted together</p>
    <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[#070405] px-2.5 py-1 text-[9px] font-bold text-primary"><Heart className="h-2.5 w-2.5" /> Join in</span>
  </RibbonCard>,
  <RibbonCard key="live" tone="dark">
    <p className="flex items-center gap-1.5 text-[9px] text-white/55"><Video className="h-3 w-3 text-primary" /> Online · 8:00 PM</p>
    <p className="mt-2 font-heading text-lg font-semibold leading-tight">Tuesday Fire Prayer</p>
    <p className="text-[10px] text-white/60">Join from anywhere</p>
  </RibbonCard>,
  <RibbonPhoto key="dawn-b" src="/assets/revival-dawn.webp" position="40% 80%" />,
]

/** A shallow arc: the middle card faces you, the outer ones turn in and shrink. */
function HeroRibbon() {
  const middle = (ribbon.length - 1) / 2
  return (
    <div aria-hidden="true" className="landing-enter landing-enter--late relative mt-14 flex select-none items-center justify-center gap-3 [perspective:1400px] sm:gap-4">
      {ribbon.map((card, index) => {
        const offset = index - middle
        const distance = Math.abs(offset)
        return (
          <div
            key={index}
            className={`shrink-0 ${distance > 2 ? 'hidden md:block' : ''}`}
            style={{
              transform: `rotateY(${-offset * 11}deg) scale(${1 - distance * 0.075})`,
              transformOrigin: offset < 0 ? 'right center' : offset > 0 ? 'left center' : 'center',
              zIndex: 10 - distance,
            }}
          >
            {card}
          </div>
        )
      })}
    </div>
  )
}

/* ── Feature cards ── */

type CardTone = 'surface' | 'rose' | 'light'

const CARD_TONES: Record<CardTone, { card: string; icon: string; body: string }> = {
  surface: { card: 'border-white/[0.07] bg-surface text-foreground hover:border-primary/30', icon: 'border-primary/25 bg-primary/10 text-primary', body: 'text-muted-foreground' },
  rose: { card: 'border-primary bg-primary text-primary-foreground', icon: 'border-black/10 bg-[#070405] text-primary', body: 'text-primary-foreground/75' },
  light: { card: 'border-white bg-[#f7eeea] text-[#1d0a10]', icon: 'border-black/10 bg-[#1d0a10] text-primary', body: 'text-[#1d0a10]/65' },
}

const FEATURES: { id: string; tone?: CardTone; icon: ElementType; title: string; desc: string }[] = [
  { id: 'word', tone: 'rose', icon: Bible, title: 'Today’s Word, every day', desc: 'A daily passage with study notes, practice and a prayer to carry into the day.' },
  { id: 'prayer', icon: HandHeart, title: 'A living prayer wall', desc: 'Share a request, and see who is praying with you.' },
  { id: 'cells', icon: Users, title: 'Revival cells near you', desc: 'Small groups that pray, study and serve the city they live in.' },
  { id: 'events', icon: CalendarDays, title: 'Gatherings worth showing up for', desc: 'Worship nights, prayer, bootcamps and outreach, in person or online.' },
  { id: 'academy', icon: GraduationCap, title: 'Rev Academy', desc: 'Courses in Scripture, prayer, leadership and Kingdom business.' },
  { id: 'create', icon: Plus, title: 'Start something', desc: 'Host an event, a gospel bootcamp or a cell in a few taps.' },
  { id: 'translations', tone: 'light', icon: BookOpen, title: 'Your translation', desc: 'Read in NIV, NKJV, NLT or AMP.' },
  { id: 'profile', icon: UserHands, title: 'A home for your journey', desc: 'Your church, your focus, the cells and events you belong to.' },
]

function FeatureCard({ icon: Icon, title, desc, tone = 'surface' }: { icon: ElementType; title: string; desc: string; tone?: CardTone }) {
  const style = CARD_TONES[tone]
  return (
    <article className={`group relative flex min-h-[230px] flex-col overflow-hidden rounded-[26px] border p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(0,0,0,0.4)] ${style.card}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${style.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-auto pt-10 font-heading text-xl font-semibold">{title}</h3>
      <p className={`mt-2 text-sm leading-6 ${style.body}`}>{desc}</p>
    </article>
  )
}

/** The feature cards, with a Shuffle button that gathers and re-deals them. */
function FeatureDeck() {
  const { ref, shuffle } = useCardDeck()
  const [order, setOrder] = useState(FEATURES)
  const reshuffle = () => void shuffle(() => setOrder(current => {
    const next = [...current]
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[next[i], next[j]] = [next[j], next[i]]
    }
    return next
  }))
  return (
    <>
      <div ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {order.map(item => <FeatureCard key={item.id} tone={item.tone} icon={item.icon} title={item.title} desc={item.desc} />)}
      </div>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={reshuffle}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-surface px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 hover:bg-surface-raised active:translate-y-0 active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-primary" /> Shuffle the deck
        </button>
      </div>
    </>
  )
}

/* ── Today's Word showcase: a story-format card with the flame in liquid metal ── */

function WordPreview() {
  return (
    <div className="relative mx-auto w-[min(84vw,340px)] sm:w-full sm:max-w-[340px] lg:max-w-[380px]">
      <div aria-hidden="true" className="absolute -inset-6 rounded-[48px] bg-[radial-gradient(closest-side,rgba(224,52,106,0.4),transparent)] blur-2xl" />
      <Link to={`/word/${TODAYS_WORD.slug}`} className="bolt-card bolt-card--hover bolt-card--inset relative block aspect-[4/5] overflow-hidden rounded-[26px] border border-white/10 bg-[#060304] shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:aspect-[9/14] sm:rounded-[32px]">
        <img src="/assets/revival-dawn.webp" alt="An open Bible lit by morning light through a chapel window" className="absolute inset-0 h-full w-full object-cover object-[78%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/90" />
        <div className="relative flex h-full flex-col p-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur-md"><Sunrise className="h-3.5 w-3.5" /> Today’s Word</span>
            <BrandMark size={44} animated />
          </div>
          <div className="mt-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{TODAYS_WORD.reference}</p>
            <p className="mt-2 font-heading text-3xl font-semibold leading-[1.05] tracking-[-0.02em]">Strength for <span className="text-primary">the waiting.</span></p>
            <p className="mt-3 text-sm leading-6 text-white/75">{TODAYS_WORD.paraphrase}</p>
            <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Read today’s Word <ArrowRight className="h-3.5 w-3.5" /></span>
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── Movement band: the flame in a glass orb, like Spyda's coin ── */

function FlameOrb() {
  return (
    <div className="relative mx-auto flex aspect-square w-[min(78vw,360px)] items-center justify-center" aria-hidden="true">
      <div className="revival-splash__halo !inset-[6%] !opacity-50" />
      <div className="absolute inset-[6%] rounded-full border border-white/10 [animation:spin_16s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
      <div className="absolute inset-[16%] rounded-full border border-primary/20 [animation:spin_10s_linear_infinite_reverse]" />
      <div className="revival-splash__glass !inset-[22%]" />
      <div className="absolute inset-[32%]"><span className="flame-chrome" /><BrandMark animated fallback="none" tint="#ffc2d3" className="absolute inset-0 h-full w-full" /></div>
    </div>
  )
}

function WayCard({ name, price, detail, desc, features, featured, texture, cta, to }: {
  name: string; price: string; detail: string; desc: string; features: string[]; featured?: boolean
  texture: 'rose' | 'ember' | 'dusk' | 'dawn'; cta: string; to: string
}) {
  return (
    <article tabIndex={0} aria-label={name} className={`bloom-texture bloom-texture--${texture} relative flex w-[84vw] max-w-[340px] shrink-0 snap-start flex-col rounded-[26px] border p-7 outline-none md:w-auto md:max-w-none ${featured ? 'border-primary/50 bg-surface-raised shadow-[0_0_0_1px_rgba(255,92,138,0.14),0_24px_60px_rgba(255,92,138,0.08)]' : 'border-white/[0.07] bg-surface'}`}>
      {featured && <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Start here</span>}
      <h3 className="font-heading text-lg font-semibold">{name}</h3>
      <p className="mt-4 font-heading text-3xl font-semibold">{price}</p>
      <p className="mt-1 text-xs text-primary">{detail}</p>
      <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">{desc}</p>
      <ul className="mt-5 flex-1 space-y-3 border-t border-white/[0.07] pt-5">
        {features.map(feature => (
          <li key={feature} className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.4} />
            {feature}
          </li>
        ))}
      </ul>
      <Link to={to} className={`mt-6 inline-flex h-11 items-center justify-center rounded-full font-heading text-[12px] font-semibold uppercase tracking-[0.12em] transition-all active:scale-[0.98] ${featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-white/[0.1] bg-surface-raised hover:bg-white/[0.07]'}`}>
        {cta}
      </Link>
    </article>
  )
}

const navLinks = [
  ['#why', 'Why Revival One'],
  ['#how', 'How it works'],
  ['#inside', 'Inside the app'],
  ['#word', 'Today’s Word'],
  ['#belong', 'Ways to belong'],
  ['#faq', 'Questions'],
]

const problems = [
  ['Faith grows thin in isolation', 'Sunday alone is not enough to carry you through the week.'],
  ['Gatherings are hard to find', 'The prayer night across town never reaches you in time.'],
  ['Growth needs a clear path', 'Most of us want to go deeper but do not know where to start.'],
]

export default function Landing() {
  const { session } = useAuth()
  const enter = session ? '/home' : '/auth?mode=sign-up'

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
      <main>
        {/* Hero: one rounded panel holding the nav, the promise and the ribbon. */}
        <section className="p-2 sm:p-3">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 sm:rounded-[34px]">
            <HeroField variant="vivid" strike className="inset-0" />

            <header className="relative z-20 flex h-16 items-center justify-between px-4 sm:h-20 sm:px-7">
              <Link to="/" className="flex items-center gap-2.5" aria-label="Revival One home">
                <BrandMark size={32} animated />
                <span className="font-heading text-lg font-semibold text-white">Revival <span className="font-bold">One</span></span>
              </Link>
              <nav className="hidden items-center gap-7 xl:flex" aria-label="Sections">
                {navLinks.map(([href, label]) => (
                  <a key={href} href={href} className="relative font-heading text-[11px] font-medium uppercase tracking-[0.16em] text-white/80 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:text-white hover:after:scale-x-100">
                    {label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                {!session && <Link to="/auth" className="hidden h-10 items-center px-3 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:text-white sm:inline-flex">Sign in</Link>}
                <Link to={session ? '/home' : '/auth?mode=sign-up'} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] sm:px-5">
                  {session ? 'Open the app' : 'Join Revival One'}
                </Link>
              </div>
            </header>

            <div className="relative z-10 px-4 pb-10 pt-10 text-center sm:pb-12 sm:pt-14">
              <div className="landing-enter mx-auto max-w-5xl">
                <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3.5 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur-md">
                  <Fire className="h-3.5 w-3.5 text-primary" /> One movement · One revival · One generation
                </p>
                <h1 className="font-heading text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.02em] text-white sm:text-6xl lg:text-[4.4rem]">
                  Faith is meant to be
                  <br />
                  <span className="text-[#ffd6e1]/95">lived together.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-white/80 sm:text-base">
                  Find people to pray with, gatherings worth showing up for, and biblical teaching you can carry into everyday life. One home for the movement, city by city.
                </p>
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <SecondaryPill href="#how"><Play className="h-3.5 w-3.5 text-primary" /> See how it works</SecondaryPill>
                  <PrimaryPill to={enter}>Join the movement</PrimaryPill>
                </div>
              </div>

              <HeroRibbon />

              <div className="landing-enter landing-enter--late mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-white/80">
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Free to join</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> A daily Word and prayer</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Real people in your city</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden py-9">
          <p className="mb-5 text-center font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">Made for the way the church gathers</p>
          <div className="partners-marquee text-muted-foreground/70">
            {[0, 1].map(loop => (
              <div key={loop} className="partners-marquee__track">
                {([
                  [Fire, 'Prayer nights'],
                  [Users, 'Revival cells'],
                  [MusicNote, 'Worship nights'],
                  [Target, 'Gospel bootcamps'],
                  [Bible, 'Bible study'],
                  [HandShake, 'City outreach'],
                  [Globe, 'Tent meetings'],
                ] as [ElementType, string][]).map(([Icon, label]) => (
                  <span key={`${label}-${loop}`} className="flex items-center gap-2.5 whitespace-nowrap font-heading text-[15px] font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07]"><Icon className="h-3.5 w-3.5" /></span>
                    {label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section id="why" className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              <Eyebrow>Why Revival One</Eyebrow>
              <h2 className="font-heading text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl lg:text-[3.6rem]">
                You were not made <HeadlineChip icon={Users} tone="ember" /> to
                <br />
                <span className="text-muted-foreground"><HeadlineChip icon={Fire} tone="rose" /> carry it alone.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground">The early church met daily, prayed together and shared everything. Revival One makes that rhythm easy to find again.</p>
            </div>

            <Deck className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <article className="group relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 md:row-span-2">
                <img src="/assets/revival-dawn.webp" alt="An open Bible on a wooden table in a quiet chapel" className="absolute inset-0 h-full w-full object-cover object-[70%_50%] transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
                <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1d0a10]"><Clock className="h-4 w-4" /></span>
                <div className="absolute inset-x-4 bottom-4 rounded-[20px] bg-[#fbf3f0] p-5 text-[#1d0a10]">
                  <p className="font-heading text-5xl font-semibold tracking-[-0.03em]">01</p>
                  <h3 className="mt-3 font-heading text-base font-semibold">{problems[0][0]}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#1d0a10]/65">{problems[0][1]}</p>
                </div>
              </article>

              <article className="flex min-h-[420px] flex-col rounded-[28px] border border-white/[0.07] bg-surface-raised p-7 md:row-span-2">
                <p className="text-sm text-muted-foreground">Prayer nights, cells, bootcamps</p>
                <p className="mt-3 font-heading text-5xl font-semibold tracking-[-0.03em]">02</p>
                <div className="mt-auto flex -space-x-3 pt-10">
                  {['AO', 'TK', 'IB', 'CE', 'FM'].map((initials, index) => (
                    <span key={initials} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-surface-raised font-heading text-xs font-semibold" style={{ background: ['#ff5c8a', '#ffb36b', '#d7b8ff', '#e0346a', '#7b1b45'][index], color: index === 4 ? '#fff' : '#1d0a10' }}>{initials}</span>
                  ))}
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold">{problems[1][0]}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{problems[1][1]}</p>
              </article>

              <article className="flex min-h-[220px] flex-col rounded-[28px] border border-primary bg-primary p-7 text-primary-foreground">
                <p className="font-heading text-5xl font-semibold tracking-[-0.03em]">03</p>
                <h3 className="mt-auto pt-6 font-heading text-lg font-semibold">{problems[2][0]}</h3>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/75">{problems[2][1]}</p>
              </article>

              <article className="flex min-h-[184px] items-end justify-between gap-6 rounded-[28px] border border-white/[0.08] bg-black p-7">
                <p className="max-w-[12rem] text-sm leading-6 text-muted-foreground">Revival One brings the Word, prayer and people into</p>
                <p className="font-heading text-5xl font-semibold tracking-[-0.03em] text-primary">One</p>
              </article>
            </Deck>
          </div>
        </section>

        <section id="how" className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="font-heading text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
                A simple rhythm <HeadlineChip icon={Sunrise} tone="rose" /> for every day.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">Read, pray, gather, grow.</p>
            </div>
            <Deck className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Bible, step: '01', title: 'Begin with the Word', copy: 'A daily passage, explained, with a practice for today.' },
                { icon: HandHeart, step: '02', title: 'Pray with others', copy: 'Bring a request to the wall, or stand with someone else’s.' },
                { icon: PeopleNearby, step: '03', title: 'Find your people', copy: 'Join a revival cell or show up to the next gathering.' },
                { icon: GraduationCap, step: '04', title: 'Grow and go', copy: 'Learn in Rev Academy, then start something of your own.' },
              ].map(item => (
                <article key={item.step} className="group flex min-h-64 flex-col rounded-[26px] border border-white/[0.07] bg-surface p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></span>
                    <span className="font-heading text-3xl font-semibold text-white/15">{item.step}</span>
                  </div>
                  <h3 className="mt-auto pt-10 font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </article>
              ))}
            </Deck>
            <AppMockup />
          </div>
        </section>

        <section id="inside" className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow>Inside the app</Eyebrow>
              <h2 className="font-heading text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
                Everything the movement needs.
                <br />
                <span className="text-muted-foreground">Nothing <HeadlineChip icon={Sparkles} tone="lilac" /> to distract you.</span>
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">Eight places to grow, all in one quiet app.</p>
            </div>
            <FeatureDeck />
          </div>
        </section>

        <section id="word" className="px-4 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
            <div>
              <p className="mb-6 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-primary"><Sunrise className="h-4 w-4" /> Today’s Word</p>
              <h2 className="max-w-2xl font-heading text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
                Start every day <HeadlineChip icon={BookOpen} tone="rose" /> in Scripture.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">One passage, read slowly. Understand it, practise it, then pray it — in about seven minutes.</p>
              <Deck className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  ['Four translations', 'NIV, NKJV, NLT and AMP, side by side.'],
                  ['Phrase by phrase', 'What the promise is forming in you.'],
                  ['Practise it today', 'Three small steps you can take before tonight.'],
                  ['Pray the Word', 'A written prayer, and a place to mark it prayed.'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-[20px] border border-white/[0.07] bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25">
                    <h3 className="font-heading text-base font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                ))}
              </Deck>
              <PrimaryPill to={`/word/${TODAYS_WORD.slug}`} className="mt-8">Read today’s Word</PrimaryPill>
            </div>
            <WordPreview />
          </div>
        </section>

        <section id="academy" className="overflow-hidden py-20 sm:py-24">
          <div className="mb-12 px-4 text-center">
            <Eyebrow>Rev Academy</Eyebrow>
            <h2 className="mx-auto max-w-3xl font-heading text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">Formed in truth. Ready for impact.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">Courses taught by pastors and practitioners from across the movement.</p>
          </div>
          <div className="relative overflow-hidden">
            <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
              {[...COURSES, ...COURSES].map((course, index) => (
                <Link to={`/academy/${course.slug}`} key={`${course.title}-${index}`} className="group flex aspect-[4/5] w-[220px] flex-col rounded-[22px] border border-white/[0.08] bg-surface p-5 shadow-[0_18px_45px_rgba(0,0,0,0.3)] transition-colors hover:border-primary/30 sm:w-[260px]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></span>
                  <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{course.category}</p>
                  <h3 className="mt-2 font-heading text-xl font-semibold leading-tight">{course.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{course.summary}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-muted-foreground">
                    <span>{course.teacher}</span>
                    <span className="font-semibold text-foreground">{course.lessons} episodes</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="movement" className="px-2 py-8 sm:px-3">
          <div className="relative mx-auto overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0607] px-5 py-16 sm:rounded-[34px] sm:px-8 sm:py-20">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#ff5c8a,#ffb36b,transparent)]" />
            <div className="relative mx-auto max-w-6xl">
              <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.82fr)] lg:gap-16">
                <div>
                  <p className="mb-6 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-primary"><Fire className="h-4 w-4" /> The movement</p>
                  <h2 className="max-w-3xl font-heading text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">Revival does not start on a stage. It starts in a room of people who pray.</h2>
                  <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Every cell, prayer night and outreach on Revival One is a small fire. Together they carry the flame city by city.</p>

                  <div className="mt-8 rounded-[24px] border border-primary/25 bg-[linear-gradient(150deg,rgba(255,92,138,0.09),rgba(255,255,255,0.01))] p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Our prayer</p>
                    <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">One generation, on fire.</p>
                    <p className="mt-2 text-sm text-muted-foreground">Believers connected, growing, and sent into every sphere of life.</p>
                  </div>

                  <ol className="mt-8 grid gap-6 sm:grid-cols-3">
                    {[
                      ['Pray', 'Every request is carried by the community.'],
                      ['Gather', 'Cells and events in the cities where you live.'],
                      ['Go', 'Bootcamps and outreach that reach neighbours.'],
                    ].map(([title, copy], index) => (
                      <li key={title} className="border-t border-white/[0.1] pt-4">
                        <p className="font-heading text-xs font-semibold text-primary">0{index + 1}</p>
                        <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <PrimaryPill to={enter}>Carry the flame</PrimaryPill>
                    <Link to="/community" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-surface px-6 whitespace-nowrap font-heading text-[12px] font-semibold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 hover:bg-surface-raised active:translate-y-0 active:scale-[0.98]"><Compass className="h-4 w-4 text-primary" /> Find a cell</Link>
                  </div>
                </div>

                <FlameOrb />
              </div>
            </div>
          </div>
        </section>

        <section id="belong" className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow>Ways to belong</Eyebrow>
              <h2 className="font-heading text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">There is a place for you here.</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">Free for every believer. Take the next step when you are ready.</p>
            </div>
            <Deck className="mx-auto mt-12 flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto px-[8vw] pb-3 pt-2 md:mt-14 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 md:pt-0 xl:grid-cols-4">
              <WayCard name="Member" price="Free" detail="Always. For every believer." desc="The Word, prayer and community, every day." features={['Today’s Word in four translations', 'The prayer wall', 'Events and revival cells', 'Your profile and journey']} texture="rose" featured cta="Join free" to="/auth?mode=sign-up" />
              <WayCard name="Cell leader" price="Host a cell" detail="Meet weekly, near you" desc="Gather a few people to pray, study and serve." features={['List your cell in your city', 'Share your meeting times', 'Leadership track in Rev Academy', 'Support from the movement']} texture="ember" cta="Start a cell" to="/community" />
              <WayCard name="Event host" price="Gather" detail="Worship, prayer, outreach" desc="Bring the city together for a night or a weekend." features={['Create events and bootcamps', 'In person or online', 'Reach believers nearby', 'Drafts saved to your account']} texture="dusk" cta="Create an event" to="/events" />
              <WayCard name="Learner" price="Grow" detail="Rev Academy courses" desc="Go deeper in Scripture, prayer and leadership." features={['Six courses to start', 'Taught by practitioners', 'Learn at your own pace', 'Kingdom business track']} texture="dawn" cta="Browse courses" to="/academy" />
            </Deck>
          </div>
        </section>

        <section id="faq" className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <Eyebrow>Questions</Eyebrow>
              <h2 className="font-heading text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-4xl">Know what to expect before you join.</h2>
            </div>
            <div className="mt-12 space-y-3">
              <BoltDisclosure title="What is Revival One?">The digital home for believers to connect, grow and carry revival city by city: a daily Word, a prayer wall, revival cells, events and Rev Academy, in one app.</BoltDisclosure>
              <BoltDisclosure title="Is it free?">Yes. Joining Revival One and using the Word, prayer wall, cells, events and academy is free for every believer.</BoltDisclosure>
              <BoltDisclosure title="What is a revival cell?">A small group that meets in a home or a local space to pray, study Scripture and serve their neighbours. Find one near you or start your own.</BoltDisclosure>
              <BoltDisclosure title="Can I host an event or a bootcamp?">Yes. Create a worship night, prayer gathering, gospel bootcamp or outreach from the app. It is saved as a draft to your account first.</BoltDisclosure>
              <BoltDisclosure title="Which Bible translations can I read?">Today’s Word offers NIV, NKJV, NLT and AMP. Where a translation cannot be shown in the app, we link you to read it on YouVersion.</BoltDisclosure>
              <BoltDisclosure title="Is Revival One a church?">No. Revival One serves believers from many local churches. We encourage every member to stay rooted in a local church family.</BoltDisclosure>
            </div>
          </div>
        </section>

        <section className="px-2 pb-8 sm:px-3">
          <div className="relative mx-auto overflow-hidden rounded-[28px] bg-primary px-6 py-16 text-center text-primary-foreground sm:rounded-[34px] sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#ffb36b]/60 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-heading text-[2.2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl">There’s a place for you here.</h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-primary-foreground/75">Pray with someone today. Find your people this week.</p>
              <Link to={enter} className="group mt-9 inline-flex h-12 items-center gap-3 rounded-full bg-[#070405] pl-6 pr-1.5 whitespace-nowrap font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
                Create your account
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 group-hover:rotate-45"><ArrowUpRight className="h-4 w-4" /></span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 py-9">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5"><BrandMark size={28} className="opacity-80" /><span className="font-heading text-sm font-semibold">Revival One</span><span className="text-xs text-muted-foreground">&copy; 2026</span></div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {[['/home', 'Home'], ['/community', 'Community'], ['/events', 'Events'], ['/academy', 'Academy']].map(([to, label]) => <Link key={to} to={to} className="transition-colors hover:text-foreground">{label}</Link>)}
            <a href="mailto:hello@revival.one" className="transition-colors hover:text-foreground">Contact</a>
          </nav>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-surface px-3.5 py-2 text-[10px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> One movement. One revival. One generation.</p>
        </div>
      </footer>
    </div>
  )
}

