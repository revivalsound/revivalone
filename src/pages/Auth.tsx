import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Fire, HandHeart, Loader, Lock, Mail, MapPin, ShieldCheck, User, Users } from '../components/ui/icons'
import BrandMark from '../components/brand/BrandMark'
import HeroField from '../components/HeroField'
import { Notice, inputClass } from '../components/ui/kit'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

/** The left panel: the movement's promise over the hero field, with a few live-looking cards. */
function Showcase({ quote }: { quote: ReactNode }) {
  return (
    <section className="relative hidden overflow-hidden rounded-[28px] border border-white/10 lg:flex lg:flex-col">
      <HeroField variant="vivid" strike className="inset-0" />
      <div className="relative z-10 flex flex-1 flex-col p-8 xl:p-10">
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3.5 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur-md">
          <Fire className="h-3.5 w-3.5 text-primary" /> One movement · One revival · One generation
        </p>
        <h1 className="mt-auto max-w-lg font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.02em] text-white xl:text-6xl">{quote}</h1>
        <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-white/70 bg-[#fbf3f0] p-4 text-[#1d0a10] shadow-[0_24px_50px_rgba(25,2,12,0.4)]">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold"><HandHeart className="h-3.5 w-3.5 text-[#e11d5c]" /> Prayer wall</p>
            <p className="mt-2 text-[12px] font-medium leading-5">Healing for the sick</p>
            <p className="mt-1 text-[11px] text-[#1d0a10]/60">214 praying</p>
          </div>
          <div className="rounded-[18px] border border-white/15 bg-[#12070b] p-4 text-white shadow-[0_24px_50px_rgba(25,2,12,0.4)]">
            <p className="flex items-center gap-1.5 text-[11px] text-white/60"><Users className="h-3.5 w-3.5 text-primary" /> Revival cell</p>
            <p className="mt-2 font-heading text-[14px] font-semibold">Yaba Central</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/55"><MapPin className="h-3 w-3" /> Fridays · 6:00 PM</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { session, loading: sessionLoading } = useAuth()
  const next = params.get('next') || '/home'
  const [isSignUp, setIsSignUp] = useState(params.get('mode') === 'sign-up')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionLoading && session) navigate(next, { replace: true })
  }, [navigate, next, session, sessionLoading])

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp)
    setError(null)
    setMessage(null)
    setPassword('')
  }

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (isSignUp) {
        if (password.length < 8) throw new Error('Use at least 8 characters for your password.')
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: fullName, city } },
        })
        if (signUpError) throw signUpError
        if (!data.session) {
          setMessage('Your account is ready. Check your inbox to confirm your email, then sign in.')
          setIsSignUp(false)
          setPassword('')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not sign you in. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!email) { setError('Enter your email address first, then choose Forgot password.'); return }
    setLoading(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false)
    if (resetError) { setError(resetError.message); return }
    setMessage('Password reset link sent. Check your inbox.')
  }

  const busy = loading || sessionLoading

  return (
    <div className="min-h-[100dvh] bg-[#060304] p-2 font-sans text-foreground sm:p-3">
      <div className="grid min-h-[calc(100dvh-1rem)] gap-2 sm:min-h-[calc(100dvh-1.5rem)] sm:gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <Showcase quote={isSignUp ? <>Carry the <span className="text-[#ffd6e1]">flame.</span></> : <>Faith grows <span className="text-[#ffd6e1]">in good company.</span></>} />

        <section className="relative flex flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0607]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_70%_at_50%_0%,rgba(176,32,79,0.3),transparent_70%)]" />

          <header className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-6">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Revival One home">
              <BrandMark size={30} animated />
              <span className="font-heading text-lg font-semibold">Revival One</span>
            </Link>
            <Link to="/" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back home
            </Link>
          </header>

          <div className="relative z-10 mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-5 py-10 sm:px-0 short:py-4">
            <div className="mb-7 flex justify-center short:hidden">
              <span className="brand-ring brand-ring--on flex h-20 w-20 items-center justify-center rounded-full bg-surface">
                <BrandMark size={44} animated />
              </span>
            </div>

            <div role="tablist" aria-label="Account" className="relative mb-7 grid grid-cols-2 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 short:mb-5">
              <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSignUp ? 'translate-x-full' : 'translate-x-0'}`} />
              <button type="button" role="tab" aria-selected={!isSignUp} onClick={() => switchMode(false)} className={`relative h-10 rounded-full text-xs font-semibold transition-colors ${!isSignUp ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={isSignUp} onClick={() => switchMode(true)} className={`relative h-10 rounded-full text-xs font-semibold transition-colors ${isSignUp ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Create account</button>
            </div>

            <div className="mb-7 text-center short:mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{isSignUp ? 'Join the movement' : 'Welcome back'}</p>
              <h2 className="mt-2.5 font-heading text-[1.9rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.2rem]">{isSignUp ? 'Find your next step.' : 'Pick up where you left off.'}</h2>
              <p className="mx-auto mt-2.5 max-w-[340px] text-sm leading-6 text-muted-foreground">
                {isSignUp ? 'Create your account and find your place in community, discipleship and Kingdom impact.' : 'Continue your journey of prayer, community, learning and Kingdom impact.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && <Notice tone="error">{error}</Notice>}
              {message && <Notice tone="ok">{message}</Notice>}

              {isSignUp && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="auth-name" className="mb-2 block text-xs font-medium text-foreground/90">Full name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input id="auth-name" required autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Your name" className={`${inputClass} pl-11 pr-4`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="auth-city" className="mb-2 block text-xs font-medium text-foreground/90">City</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input id="auth-city" required autoComplete="address-level2" value={city} onChange={event => setCity(event.target.value)} placeholder="Lagos" className={`${inputClass} pl-11 pr-4`} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-2 block text-xs font-medium text-foreground/90">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className={`${inputClass} pl-11 pr-4`} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="auth-password" className="block text-xs font-medium text-foreground/90">Password</label>
                  {!isSignUp && <button type="button" onClick={resetPassword} className="text-xs font-medium text-primary transition-colors hover:text-primary/80">Forgot password?</button>}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} required value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignUp ? 'At least 8 characters' : 'Your password'} className={`${inputClass} pl-11 pr-12`} />
                  <button type="button" onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>

              <button type="submit" disabled={busy} className="group !mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-[0_14px_38px_rgba(255,92,138,0.22)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
                {busy ? <Loader className="h-5 w-5 animate-spin" /> : isSignUp ? 'Join the movement' : 'Enter Revival One'}
                {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground short:mt-4">
              {isSignUp ? 'Already have an account?' : 'New to the movement?'}{' '}
              <button type="button" onClick={() => switchMode(!isSignUp)} className="font-semibold text-primary transition-colors hover:text-primary/80">{isSignUp ? 'Sign in' : 'Create your account'}</button>
            </p>
          </div>

          <footer className="relative z-10 flex flex-col items-center gap-1 px-5 pb-5 text-center text-[11px] text-muted-foreground/80 sm:pb-6">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure sign-in with Supabase</span>
          </footer>
        </section>
      </div>
    </div>
  )
}
