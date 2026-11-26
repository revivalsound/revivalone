import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, ExternalLink, Heart, Lightbulb, Loader, Share, Sunrise } from '../../components/ui/icons'
import BrandMark from '../../components/brand/BrandMark'
import { Deck } from '../../components/ui/kit'
import { TODAYS_WORD } from '../../lib/content'

const VERSIONS = [
  { code: 'NIV', name: 'New International Version', link: 'https://www.bible.com/bible/111/ISA.40.NIV' },
  { code: 'NKJV', name: 'New King James Version', link: 'https://www.bible.com/bible/114/ISA.40.NKJV' },
  { code: 'NLT', name: 'New Living Translation', link: 'https://www.bible.com/bible/116/ISA.40.NLT' },
  { code: 'AMP', name: 'Amplified Bible', link: 'https://www.bible.com/bible/1588/ISA.40.AMP' },
]

type Passage = { configured?: boolean; content?: string; copyright?: string; externalUrl?: string; error?: string }

const RELATED = [
  ['PS', 'Psalm 27:14', 'Courage while you wait', 'https://www.bible.com/bible/111/PSA.27.14.NIV'],
  ['2C', '2 Corinthians 12:9', 'Strength in weakness', 'https://www.bible.com/bible/111/2CO.12.9.NIV'],
  ['GA', 'Galatians 6:9', 'Do not grow weary', 'https://www.bible.com/bible/111/GAL.6.9.NIV'],
]

export default function Word() {
  const [selected, setSelected] = useState('NIV')
  const [passage, setPassage] = useState<Passage>({})
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)
  const [prayed, setPrayed] = useState(false)
  const current = VERSIONS.find(version => version.code === selected) ?? VERSIONS[0]

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/bible-passage?version=${selected}`)
      .then(async response => ({ ok: response.ok, body: await response.json().catch(() => ({})) }))
      .then(({ ok, body }) => { if (active) setPassage(ok ? body : { ...body, configured: body.configured ?? false }) })
      .catch(() => { if (active) setPassage({ configured: false, error: 'Bible text is temporarily unavailable.' }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selected])

  async function shareWord() {
    try {
      if (navigator.share) await navigator.share({ title: `Today’s Word · ${TODAYS_WORD.reference}`, url: window.location.href })
      else if (navigator.clipboard) { await navigator.clipboard.writeText(window.location.href); setShared(true) }
    } catch {
      // Dismissing the share sheet leaves the reading unchanged.
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Link to="/home" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
        <button type="button" onClick={shareWord} className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 text-xs font-medium transition-colors hover:bg-white/[0.07]">{shared ? <><Check className="h-3.5 w-3.5 text-primary" /> Link copied</> : <><Share className="h-3.5 w-3.5" /> Share</>}</button>
      </div>

      <section className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10">
        <img src="/assets/revival-dawn.webp" alt="An open Bible lit by morning light through a chapel window" className="absolute inset-0 h-full w-full object-cover object-[75%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/10" />
        <div className="relative max-w-2xl p-7 py-14 sm:p-12 sm:py-20">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><Sunrise className="h-4 w-4" /> Daily Scripture · {TODAYS_WORD.reference}</p>
          <h1 className="mt-4 font-heading text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-6xl">Strength for <span className="text-primary">the waiting.</span></h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/80">Isaiah 40:31 is not a promise that faithful people never grow tired. It is an invitation to discover where renewed strength comes from when they do.</p>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/75 backdrop-blur-md"><Clock className="h-3.5 w-3.5" /> 7 min read</p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section id="scripture" className="scroll-mt-20 rounded-[28px] border border-white/[0.07] bg-surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">The Scripture</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold">{TODAYS_WORD.reference}</h2>
              </div>
              <a href={current.link} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">Full chapter <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Bible translation">
              {VERSIONS.map(version => (
                <button key={version.code} type="button" aria-pressed={selected === version.code} onClick={() => setSelected(version.code)} className={`bolt-card rounded-[16px] border px-3 py-3 text-left transition-colors ${selected === version.code ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]'}`}>
                  <b className={`block font-heading text-sm ${selected === version.code ? 'text-primary' : ''}`}>{version.code}</b>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{version.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 min-h-[120px]" aria-live="polite">
              {loading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader className="h-4 w-4 animate-spin" /> Loading {current.code}…</p>
              ) : passage.content ? (
                <>
                  <blockquote className="border-l-2 border-primary pl-5 font-heading text-xl leading-relaxed sm:text-2xl">{passage.content}</blockquote>
                  {passage.copyright && <p className="mt-3 text-[11px] text-muted-foreground">{passage.copyright}</p>}
                </>
              ) : (
                <div className="rounded-[18px] border border-dashed border-white/[0.12] p-5">
                  <b className="font-heading text-sm">{current.name}</b>
                  <p className="mt-1 text-sm text-muted-foreground">This translation is unavailable in the in-app reader.</p>
                  <a href={passage.externalUrl ?? current.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Read on YouVersion <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-[18px] bg-primary/[0.07] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Devotional paraphrase</p>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{TODAYS_WORD.paraphrase}</p>
            </div>
          </section>

          <article id="understand" className="scroll-mt-20 rounded-[28px] border border-white/[0.07] bg-surface p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="font-heading text-3xl font-semibold text-white/15">01</span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Understand the Word</p>
                <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.02em]">Waiting is not <span className="text-primary">wasted time.</span></h2>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-[15px] leading-7 text-muted-foreground">
              <p>Isaiah speaks to people who have carried disappointment for so long that weariness feels permanent. Their question is not whether God exists, but whether He still sees them. The chapter answers with a vision of a God whose understanding is beyond measure and whose strength never runs dry.</p>
              <p>To wait for the Lord is not to sit without direction. Biblical waiting is active trust: holding your position, listening for instruction, and refusing to build your future from panic. Hope becomes the place where exhausted strength is exchanged for God’s supply.</p>
            </div>
            <blockquote className="mt-6 rounded-[20px] border border-white/[0.07] bg-surface-raised p-5 font-heading text-lg leading-relaxed">God does not only give strength for the spectacular moment. He gives grace to soar, to run, and — most often — to keep walking.</blockquote>
          </article>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Phrase by phrase</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.02em]">What the promise <span className="text-primary">is forming in you.</span></h2>
            <Deck className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ['Hope in the Lord', 'Move your expectation away from outcomes you cannot control and anchor it in the character of God.'],
                ['Renewed strength', 'Renewal is an exchange. Bring honest weakness; receive the strength needed for today’s obedience.'],
                ['Keep walking', 'Maturity is not measured only by moments of flight. Quiet consistency is also evidence of sustaining grace.'],
              ].map(([title, copy], index) => (
                <article key={title} className={`flex min-h-[200px] flex-col rounded-[24px] border p-6 ${index === 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-white/[0.07] bg-surface'}`}>
                  <span className={`font-heading text-3xl font-semibold ${index === 1 ? 'text-primary-foreground/40' : 'text-white/15'}`}>0{index + 1}</span>
                  <h3 className="mt-auto pt-6 font-heading text-lg font-semibold">{title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${index === 1 ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{copy}</p>
                </article>
              ))}
            </Deck>
          </section>

          <section id="practice" className="scroll-mt-20 rounded-[28px] border border-white/[0.07] bg-[#0b0607] p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Practise the Word</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.02em]">Carry it into <span className="text-primary">today.</span></h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['Name the weight.', 'Write down the one situation that is draining your strength.'],
                ['Wait without noise.', 'Give God ten unhurried minutes before reaching for another solution.'],
                ['Take the faithful step.', 'Do the next clear thing, even if the full path is not visible yet.'],
              ].map(([title, copy], index) => (
                <li key={title} className="border-t border-white/[0.1] pt-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground">{index + 1}</span>
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="prayer" className={`bolt-card scroll-mt-20 rounded-[28px] border p-6 text-center transition-colors sm:p-10 ${prayed ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-surface'}`}>
            <BrandMark size={56} animated className="mx-auto" />
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Pray the Word</p>
            <p className="mx-auto mt-4 max-w-2xl font-heading text-xl leading-relaxed sm:text-2xl">Father, I bring You the places where I am tired of waiting. Re-anchor my hope in who You are. Exchange my anxiety for Your strength, teach me to recognise today’s grace, and keep me faithful on the road ahead. Amen.</p>
            <button type="button" onClick={() => setPrayed(value => !value)} aria-pressed={prayed} className={`mt-7 inline-flex h-11 items-center gap-2 rounded-full px-6 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] transition-all active:scale-[0.98] ${prayed ? 'bg-primary text-primary-foreground' : 'border border-white/[0.12] bg-surface-raised hover:bg-white/[0.07]'}`}>
              {prayed ? <><Check className="h-4 w-4" strokeWidth={2.4} /> Prayer marked</> : <><Heart className="h-4 w-4 text-primary" /> I prayed this</>}
            </button>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <nav className="rounded-[24px] border border-white/[0.07] bg-surface p-5" aria-label="In this reading">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">In this reading</p>
            <div className="mt-3 space-y-1">
              {[['#scripture', 'The Scripture'], ['#understand', 'Understand'], ['#practice', 'Practise'], ['#prayer', 'Pray']].map(([href, label], index) => (
                <a key={href} href={href} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-foreground/85 transition-colors hover:bg-white/[0.04]"><span className="font-heading text-xs text-primary">0{index + 1}</span>{label}</a>
              ))}
            </div>
          </nav>
          <section className="rounded-[24px] border border-primary bg-primary p-5 text-primary-foreground">
            <Lightbulb className="h-5 w-5" />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">Key thought</p>
            <h3 className="mt-2 font-heading text-lg font-semibold leading-snug">Waiting becomes worship when trust replaces the need to control.</h3>
          </section>
          <section className="rounded-[24px] border border-white/[0.07] bg-surface p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Keep reading</p>
            <div className="mt-3 space-y-2">
              {RELATED.map(([mark, reference, copy, href]) => (
                <a key={reference} href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-heading text-[11px] font-semibold text-primary">{mark}</span>
                  <span className="min-w-0 flex-1"><b className="block text-sm font-semibold">{reference}</b><small className="text-xs text-muted-foreground">{copy}</small></span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
