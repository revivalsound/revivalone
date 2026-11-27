import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AddSquare, Bible, Check, Download, Fire, Share, Smartphone, WifiOff, X } from './ui/icons'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const DISMISSED_KEY = 'revival.install.dismissed'
const SNOOZE_DAYS = 5
const DELAY_MS = 2800

function standalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function snoozed() {
  try {
    const at = Number(window.localStorage.getItem(DISMISSED_KEY) || 0)
    return Date.now() - at < SNOOZE_DAYS * 86_400_000
  } catch { return false }
}

// iPhone and iPad Safari never fire beforeinstallprompt, so they get steps instead.
function iosSafari() {
  const ua = navigator.userAgent
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
}

/**
 * Invites visitors to install Revival Sound Tent. On Android and desktop Chrome/Edge it
 * uses the browser's install prompt behind a card of our own; on iPhone it shows
 * the Add to Home Screen steps. Not shown once installed, or for a few days
 * after "Not now".
 */
export default function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [mode, setMode] = useState<'install' | 'ios' | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (standalone()) return
    let timer = 0
    const onPrompt = (prompt: Event) => {
      prompt.preventDefault()
      setEvent(prompt as InstallEvent)
      if (!snoozed()) { window.clearTimeout(timer); timer = window.setTimeout(() => setMode('install'), DELAY_MS) }
    }
    const onInstalled = () => { setMode(null); setInstalled(true); window.setTimeout(() => setInstalled(false), 3200) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    if (iosSafari() && !snoozed()) timer = window.setTimeout(() => setMode('ios'), DELAY_MS)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); window.clearTimeout(timer) }
  }, [])

  function close(remember = true) {
    if (remember) { try { window.localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch { /* storage unavailable */ } }
    setLeaving(true)
    window.setTimeout(() => { setMode(null); setLeaving(false) }, 320)
  }

  async function install() {
    if (!event) return
    await event.prompt()
    const choice = await event.userChoice
    setEvent(null)
    close(choice.outcome !== 'accepted')
  }

  if (installed) {
    return createPortal(
      <div className="install-toast theme-dark fixed inset-x-0 bottom-24 z-[80] mx-auto flex w-fit items-center gap-2 rounded-full bg-surface-raised px-5 py-3 text-sm font-semibold text-foreground shadow-[0_18px_40px_rgba(0,0,0,0.45)] lg:bottom-8">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" strokeWidth={2.6} /></span> Revival Sound Tent is on your home screen
      </div>,
      document.body,
    )
  }
  if (!mode) return null

  return createPortal(
    <div className={`install-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-end sm:justify-end sm:p-6 ${leaving ? 'install-backdrop--out' : ''}`} onClick={() => close()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        onClick={clicked => clicked.stopPropagation()}
        className={`install-card theme-dark relative w-full max-w-[400px] overflow-hidden rounded-[30px] border border-white/10 bg-surface text-foreground shadow-[0_30px_90px_rgba(0,0,0,0.6)] ${leaving ? 'install-card--out' : ''}`}
      >
        {/* Glow and the lightning ring around the card */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-primary/35 blur-3xl" />
        <div aria-hidden className="bolt-card bolt-card--on pointer-events-none absolute inset-0 rounded-[30px]" />

        <button type="button" onClick={() => close()} aria-label="Not now" className="absolute right-4 top-4 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>

        <div className="relative px-6 pb-6 pt-7">
          <div className="install-icon mx-auto flex h-20 w-20 items-center justify-center">
            <span className="brand-ring brand-ring--on block rounded-[24px]">
              <img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-[24px]" />
            </span>
          </div>
          <p className="mt-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Get the app</p>
          <h2 id="install-title" className="mt-1.5 text-center font-heading text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]">Install Revival Sound Tent</h2>
          <p className="mx-auto mt-2 max-w-[18rem] text-center text-sm leading-6 text-muted-foreground">Open it from your home screen like any app. No app store needed.</p>

          <ul className="mt-5 space-y-2">
            {([
              [Smartphone, 'Full screen, one tap away'],
              [Bible, 'Your Bible and daily guide, ready every morning'],
              [WifiOff, 'Chapters you’ve read open offline'],
            ] as const).map(([Icon, text], index) => (
              <li key={text} className="install-perk flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3.5 py-2.5 text-[13px]" style={{ animationDelay: `${260 + index * 70}ms` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Icon className="h-4 w-4" /></span>{text}
              </li>
            ))}
          </ul>

          {mode === 'install' ? (
            <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={() => void install()} className="install-cta inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_14px_34px_rgba(255,92,138,0.4)] transition-transform active:scale-[0.97]">
                <Download className="h-4 w-4" strokeWidth={2.4} /> Install
              </button>
              <button type="button" onClick={() => close()} className="h-12 rounded-full px-5 text-sm font-semibold text-muted-foreground hover:text-foreground">Not now</button>
            </div>
          ) : (
            <div className="mt-6 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">On iPhone or iPad</p>
              <ol className="mt-3 space-y-2.5 text-[13px]">
                <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">1</span> Tap <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2 py-1 font-semibold"><Share className="h-3.5 w-3.5 text-primary" /> Share</span> in Safari’s toolbar</li>
                <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">2</span> Choose <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2 py-1 font-semibold"><AddSquare className="h-3.5 w-3.5 text-primary" /> Add to Home Screen</span></li>
                <li className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">3</span> Tap <b>Add</b>, then open <Fire className="h-4 w-4 text-primary" /> <strong>REST</strong></li>
              </ol>
              <button type="button" onClick={() => close()} className="mt-4 h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground">Got it</button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
