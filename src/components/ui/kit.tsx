import { useState, type ElementType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown } from './icons'
import { useCardDeck } from '../landing/useCardDeck'

/** Pink pill with its round arrow badge: the one primary action style (Spyda's PrimaryPill). */
export function PrimaryPill({ to, children, className = '', onClick }: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group inline-flex h-12 items-center justify-between gap-3 rounded-full bg-primary pl-6 pr-1.5 whitespace-nowrap font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_14px_40px_rgba(255,92,138,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(255,92,138,0.36)] active:translate-y-0 active:scale-[0.98] ${className}`}
    >
      {children}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-shell text-primary transition-transform duration-200 group-hover:rotate-45">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

/** The dark glass pill that sits beside the pink one. */
export function SecondaryPill({ href, to, children, className = '' }: { href?: string; to?: string; children: ReactNode; className?: string }) {
  const classes = `inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-plum/55 px-6 whitespace-nowrap font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-plum/75 active:translate-y-0 active:scale-[0.98] ${className}`
  return to ? <Link to={to} className={classes}>{children}</Link> : <a href={href} className={classes}>{children}</a>
}

/** A compact action button used inside the app. */
export function ActionButton({ children, onClick, tone = 'primary', type = 'button', disabled, className = '' }: {
  children: ReactNode; onClick?: () => void; tone?: 'primary' | 'quiet'; type?: 'button' | 'submit'; disabled?: boolean; className?: string
}) {
  const tones = {
    primary: 'bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(255,92,138,0.22)] hover:bg-primary/90',
    quiet: 'border border-white/[0.1] bg-surface-raised text-foreground hover:bg-white/[0.07]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

/** A round icon set inline with headline type, like a word of its own. */
export function HeadlineChip({ icon: Icon, tone }: { icon: ElementType; tone: 'rose' | 'ember' | 'lilac' }) {
  const tones = {
    rose: 'bg-primary text-primary-foreground',
    ember: 'bg-ember text-[#3a1503]',
    lilac: 'bg-lilac text-[#22073a]',
  }
  return (
    <span aria-hidden="true" className={`mx-[0.12em] inline-flex h-[0.86em] w-[0.86em] -translate-y-[0.06em] items-center justify-center rounded-full align-middle ${tones[tone]}`}>
      <Icon className="h-[0.46em] w-[0.46em]" strokeWidth={2.2} />
    </span>
  )
}

export function Eyebrow({ children, align = 'center' }: { children: ReactNode; align?: 'center' | 'start' }) {
  return (
    <p className={`mb-6 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground ${align === 'center' ? 'justify-center' : ''}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </p>
  )
}

/** A grid of cards dealt out like a deck when it scrolls into view (see useCardDeck). */
export function Deck({ className, children }: { className: string; children: ReactNode }) {
  const { ref } = useCardDeck()
  return <div ref={ref} className={className}>{children}</div>
}

/** A question card whose border is struck by lightning when it opens. */
export function BoltDisclosure({ title, meta, icon: Icon, children, defaultOpen = false }: {
  title: ReactNode; meta?: ReactNode; icon?: ElementType; children: ReactNode; defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className={`bolt-card rounded-[20px] border transition-colors ${isOpen ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-surface hover:border-white/[0.14]'}`}>
      <button type="button" onClick={() => setIsOpen(previous => !previous)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-6">
        <span className="flex min-w-0 items-center gap-4">
          {Icon && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>}
          <span className="min-w-0">
            <span className="block font-heading text-base font-medium text-foreground">{title}</span>
            {meta && <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span>}
          </span>
        </span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${isOpen ? 'rotate-180 bg-primary text-primary-foreground' : 'bg-white/[0.06] text-muted-foreground'}`}>
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden"><div className="px-5 pb-6 text-sm leading-6 text-muted-foreground sm:px-6">{children}</div></div>
      </div>
    </div>
  )
}

export function Notice({ tone, children }: { tone: 'error' | 'ok'; children: ReactNode }) {
  return tone === 'error'
    ? <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-sm leading-5 text-red-300">{children}</div>
    : <div role="status" className="rounded-2xl border border-primary/25 bg-primary/[0.07] px-4 py-3 text-sm leading-5 text-primary">{children}</div>
}

export const inputClass = 'h-12 w-full rounded-2xl border border-white/[0.09] bg-white/[0.03] text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-primary/10 disabled:opacity-60'
