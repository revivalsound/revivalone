import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import BrandMark from '../components/brand/BrandMark'
import { ArrowLeft, ArrowRight, Globe, Loader, MapPin, Users } from '../components/ui/icons'
import { ActionButton, Notice, inputClass } from '../components/ui/kit'
import { useAuth } from '../lib/AuthContext'
import { dismissProfileSetupLocally, needsProfileSetup, safeAppDestination } from '../lib/profileSetup'
import { fetchMemberProfile, updateMyProfile, type MemberProfile, type ProfileUpdate } from '../lib/profiles'
import { supabase } from '../lib/supabase'

type Draft = Pick<MemberProfile, 'city' | 'country' | 'church' | 'bio'>

const fields = {
  1: ['city', 'country'],
  2: ['church', 'bio'],
} as const

export default function Onboarding() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const destination = safeAppDestination(params.get('next'))
  if (!user || !needsProfileSetup(user)) return <Navigate to={destination} replace />
  return <ProfileSetup key={user.id} userId={user.id} destination={destination} />
}

function ProfileSetup({ userId, destination }: { userId: string; destination: string }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [attempt, setAttempt] = useState(0)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<Draft | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let active = true
    void fetchMemberProfile(userId).then(profile => {
      if (!profile) throw new Error('Your profile isn’t ready yet.')
      if (!active) return
      const current = { city: profile.city ?? '', country: profile.country ?? '', church: profile.church ?? '', bio: profile.bio ?? '' }
      setDraft(current)
      setSaved(current)
    }).catch(() => {
      if (active) setLoadError('We couldn’t load your profile. Try again, or skip setup and edit your profile later.')
    })
    return () => { active = false }
  }, [userId, attempt])

  useEffect(() => { heading.current?.focus() }, [step])

  function skipSetup() {
    dismissProfileSetupLocally(userId)
    navigate(destination, { replace: true })
    void supabase.auth.updateUser({ data: { profile_setup: 'skipped' } }).catch(() => undefined)
  }

  function update(field: keyof Draft, value: string) {
    setDraft(current => current && { ...current, [field]: value })
    setSaveError('')
  }

  async function advance(saveStep: boolean) {
    if (saving || !draft || !saved) return
    setSaveError('')
    if (!saveStep && step === 1) {
      setStep(2)
      return
    }
    setSaving(true)
    try {
      if (saveStep) {
        const patch: ProfileUpdate = {}
        for (const field of fields[step]) {
          const value = draft[field].trim()
          if (value !== saved[field]) patch[field] = value
        }
        if (Object.keys(patch).length) {
          await updateMyProfile(userId, patch)
          setSaved({ ...saved, ...patch })
        }
      }
      if (step === 1) {
        setStep(2)
      } else {
        const { error } = await supabase.auth.updateUser({ data: { profile_setup: 'completed' } })
        if (error) throw error
        navigate(destination, { replace: true })
      }
    } catch {
      setSaveError('We couldn’t finish saving. Try again, or skip setup to continue to the app.')
    } finally {
      setSaving(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void advance(true)
  }

  return (
    <main className="theme-dark min-h-[100dvh] bg-shell p-2 font-sans text-foreground sm:p-3">
      <section className="relative flex min-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-shell sm:min-h-[calc(100dvh-1.5rem)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_70%_at_50%_0%,rgba(176,32,79,0.3),transparent_70%)]" />
        <header className="relative z-10 flex items-center justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Revival Sound Tent home">
            <BrandMark size={30} animated />
            <strong className="font-heading text-lg font-bold">REST</strong>
          </Link>
          <ActionButton tone="quiet" onClick={skipSetup} disabled={saving}>Skip setup</ActionButton>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-5 py-8 sm:px-0 sm:py-10">
          <div className="mb-6 flex justify-center short:hidden" aria-hidden="true">
            <span className="brand-ring brand-ring--on flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <BrandMark size={36} />
            </span>
          </div>
          <div className="mb-6 text-center">
            <p className="text-xs font-medium text-primary">Profile setup · Step {step} of 2</p>
            <h1 ref={heading} tabIndex={-1} className="mt-2.5 font-heading text-[1.9rem] font-semibold leading-tight tracking-[-0.02em] outline-none sm:text-[2.2rem]">
              {step === 1 ? 'Where are you based?' : 'Tell us a little about yourself'}
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
              {step === 1 ? 'Add a location to help other members find you. You can skip it or edit it later.' : 'Add a church or a short bio to your public profile. Both are optional.'}
            </p>
          </div>

          {loadError ? (
            <div className="space-y-4">
              <Notice tone="error">{loadError}</Notice>
              <ActionButton onClick={() => { setLoadError(''); setAttempt(current => current + 1) }} className="w-full">Try again</ActionButton>
            </div>
          ) : !draft ? (
            <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading your profile
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {step === 1 ? (
                <>
                  <SetupField label="City" id="setup-city" icon={<MapPin className="h-4 w-4" />}>
                    <input id="setup-city" autoComplete="address-level2" maxLength={80} disabled={saving} className={`${inputClass} pl-11 pr-4`} value={draft.city} onChange={event => update('city', event.target.value)} />
                  </SetupField>
                  <SetupField label="Country" id="setup-country" icon={<Globe className="h-4 w-4" />}>
                    <input id="setup-country" autoComplete="country-name" maxLength={80} disabled={saving} className={`${inputClass} pl-11 pr-4`} value={draft.country} onChange={event => update('country', event.target.value)} />
                  </SetupField>
                </>
              ) : (
                <>
                  <SetupField label="Church or community" id="setup-church" icon={<Users className="h-4 w-4" />}>
                    <input id="setup-church" maxLength={120} disabled={saving} className={`${inputClass} pl-11 pr-4`} value={draft.church} onChange={event => update('church', event.target.value)} />
                  </SetupField>
                  <SetupField label="Bio" id="setup-bio">
                    <textarea id="setup-bio" rows={3} maxLength={500} disabled={saving} className={`${inputClass} h-auto resize-y px-4 py-3 leading-6`} value={draft.bio} onChange={event => update('bio', event.target.value)} />
                  </SetupField>
                </>
              )}
              {saveError && <Notice tone="error">{saveError}</Notice>}
              <ActionButton type="submit" disabled={saving} className="w-full">
                {saving ? <><Loader className="h-4 w-4 animate-spin" aria-hidden="true" />Saving…</> : <>{step === 1 ? 'Continue' : 'Finish setup'}<ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </ActionButton>
              <div className={`flex items-center gap-3 ${step === 1 ? 'justify-center' : 'justify-between'}`}>
                {step === 2 && (
                  <button type="button" onClick={() => { setSaveError(''); setStep(1) }} disabled={saving} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                  </button>
                )}
                <button type="button" onClick={() => void advance(false)} disabled={saving} className="min-h-11 text-sm font-medium text-primary hover:underline disabled:opacity-50">Skip this step</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

function SetupField({ label, id, icon, children }: { label: string; id: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-foreground/90">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">{icon}</span>}
        {children}
      </div>
    </div>
  )
}
