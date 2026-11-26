import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Check, Globe, Loader, Lock, LogOut, Mail, MapPin, Moon, Sun, Trash, User, Users } from '../../components/ui/icons'
import { Notice, inputClass } from '../../components/ui/kit'
import { AuthorAvatar } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { useTheme } from '../../lib/theme'
import { fetchMemberProfile, profileExtras, updateMyProfile, uploadProfilePhoto, type MemberProfile } from '../../lib/profiles'

const FOCUS_OPTIONS = ['Prayer', 'Worship', 'Evangelism', 'Discipleship', 'Missions', 'Youth', 'Students', 'Families', 'Marketplace', 'Business', 'Media', 'Music', 'Teaching', 'Leadership', 'Healing', 'Outreach']

type Draft = Pick<MemberProfile, 'full_name' | 'bio' | 'city' | 'country' | 'church' | 'website'> & { focuses: string[] }

/** Profile settings: photos, the details on your profile, and your account. */
export default function ProfileSettings() {
  const navigate = useNavigate()
  const { user, signOut, setProfileLocally, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [extras, setExtras] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [photo, setPhoto] = useState<{ kind: 'avatar' | 'cover'; state: 'uploading' | 'ok' | 'error'; text?: string } | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    void profileExtras().then(setExtras)
    fetchMemberProfile(user.id).then(found => {
      if (!found) return
      setProfile(found)
      setDraft({
        full_name: found.full_name || String(user?.user_metadata?.full_name ?? ''),
        bio: found.bio, city: found.city, country: found.country, church: found.church, website: found.website,
        focuses: found.ministry_focus.split(/[,·]/).map(item => item.trim()).filter(Boolean).slice(0, 5),
      })
    }).catch(caught => setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'We couldn’t load your profile.' }))
  }, [user])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft(current => (current ? { ...current, [key]: value } : current)); setMessage(null) }

  async function changePhoto(kind: 'avatar' | 'cover', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return
    if (kind === 'cover' && !extras) { setPhoto({ kind, state: 'error', text: 'Cover photos need supabase/profile-v2.sql to be run first.' }); return }
    setPhoto({ kind, state: 'uploading' })
    try {
      const url = await uploadProfilePhoto(user.id, file, kind)
      await updateMyProfile(user.id, kind === 'avatar' ? { avatar_url: url } : { cover_url: url })
      setProfile(current => (current ? { ...current, [kind === 'avatar' ? 'avatar_url' : 'cover_url']: url } : current))
      if (kind === 'avatar') setProfileLocally({ avatar_url: url })
      setPhoto({ kind, state: 'ok', text: kind === 'avatar' ? 'Profile photo updated.' : 'Cover photo updated.' })
    } catch (caught) {
      setPhoto({ kind, state: 'error', text: caught instanceof Error ? caught.message : 'We couldn’t upload that photo.' })
    }
  }

  async function removeCover() {
    if (!user) return
    setPhoto({ kind: 'cover', state: 'uploading' })
    try {
      await updateMyProfile(user.id, { cover_url: null })
      setProfile(current => (current ? { ...current, cover_url: null } : current))
      setPhoto({ kind: 'cover', state: 'ok', text: 'Cover photo removed.' })
    } catch (caught) {
      setPhoto({ kind: 'cover', state: 'error', text: caught instanceof Error ? caught.message : 'We couldn’t remove the cover.' })
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft) return
    if (draft.full_name.trim().length < 2) { setMessage({ tone: 'error', text: 'Enter your name.' }); return }
    const website = draft.website.trim()
    if (website && !/^https?:\/\//i.test(website)) { setMessage({ tone: 'error', text: 'Your website needs to start with https://' }); return }
    setSaving(true); setMessage(null)
    try {
      await updateMyProfile(user.id, {
        full_name: draft.full_name.trim(), bio: draft.bio.trim(), city: draft.city.trim(), country: draft.country.trim(),
        church: draft.church.trim(), website, ministry_focus: draft.focuses.join(', '),
      })
      setProfileLocally({ full_name: draft.full_name.trim() })
      void refreshProfile()
      setMessage({ tone: 'ok', text: 'Your profile is saved.' })
      window.setTimeout(() => navigate('/profile'), 700)
    } catch (caught) {
      setMessage({ tone: 'error', text: caught instanceof Error ? caught.message : 'We couldn’t save your profile.' })
    } finally {
      setSaving(false)
    }
  }

  if (!profile || !draft) {
    return <div className="flex min-h-[60vh] items-center justify-center" role="status"><span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-surface"><User className="h-6 w-6 text-primary" /></span>{message && <div className="absolute"><Notice tone="error">{message.text}</Notice></div>}</div>
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      {/* Header */}
      <div className="sticky top-14 z-20 -mx-4 flex items-center gap-3 border-b border-white/[0.06] bg-background px-4 py-3 sm:-mx-6 sm:px-6">
        <Link to="/profile" aria-label="Back to your profile" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.09]"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="flex-1 font-heading text-lg font-semibold">Edit profile</h1>
        <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-60">
          {saving ? <><Loader className="h-4 w-4 animate-spin" /> Saving</> : <><Check className="h-4 w-4" /> Save</>}
        </button>
      </div>

      {message && <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div>}

      {/* Photos */}
      <section className="mt-6">
        <div className="theme-dark relative h-40 overflow-hidden rounded-[26px] border border-white/10 sm:h-52">
          {profile.cover_url
            ? <img src={profile.cover_url} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
            : <><div className="absolute inset-0 hero-field-fallback--vivid" /><div className="absolute inset-0 hero-field-scrim--vivid" /></>}
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute bottom-3 right-3 flex gap-2">
            {profile.cover_url && <button type="button" onClick={removeCover} aria-label="Remove cover photo" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-red-500/80"><Trash className="h-4 w-4" /></button>}
            <button type="button" onClick={() => coverInput.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full bg-black/45 px-4 text-[13px] font-semibold text-white backdrop-blur-md hover:bg-black/65">
              {photo?.kind === 'cover' && photo.state === 'uploading' ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {profile.cover_url ? 'Change cover' : 'Add a cover'}
            </button>
          </div>
          <input ref={coverInput} type="file" accept="image/*" className="sr-only" onChange={event => void changePhoto('cover', event)} />
        </div>

        <div className="flex items-end gap-4 px-2 sm:px-5">
          <button type="button" onClick={() => avatarInput.current?.click()} aria-label="Change profile photo" className="group relative -mt-12 shrink-0 rounded-full">
            <span className="block rounded-full border-[5px] border-background">
              <AuthorAvatar author={profile} size="h-24 w-24 sm:h-28 sm:w-28" text="text-2xl" />
            </span>
            <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
              {photo?.kind === 'avatar' && photo.state === 'uploading' ? <Loader className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
            </span>
            <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              {photo?.kind === 'avatar' && photo.state === 'uploading' ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </span>
          </button>
          <input ref={avatarInput} type="file" accept="image/*" className="sr-only" onChange={event => void changePhoto('avatar', event)} />
          <div className="min-w-0 pb-2">
            <p className="text-sm font-semibold">Profile photo</p>
            <p className="text-xs text-muted-foreground">Tap your photo to change it. Phone photos are resized for you.</p>
          </div>
        </div>
        {photo && photo.state !== 'uploading' && (
          <p role="status" className={`mt-3 flex items-center gap-1.5 px-2 text-sm font-semibold sm:px-5 ${photo.state === 'ok' ? 'text-primary' : 'text-red-400'}`}>{photo.state === 'ok' && <Check className="h-4 w-4" />}{photo.text}</p>
        )}
      </section>

      {/* About you */}
      <Group title="About you" description="What people see on your profile.">
        <Field label="Name" icon={<User className="h-4 w-4" />}>
          <input required minLength={2} maxLength={100} value={draft.full_name} onChange={event => set('full_name', event.target.value)} className={`${inputClass} pl-11 pr-4`} />
        </Field>
        <label className="block text-xs font-medium text-foreground/90">
          <span className="flex items-center justify-between">Bio <span className="text-muted-foreground">{draft.bio.length}/500</span></span>
          <textarea rows={4} maxLength={500} value={draft.bio} onChange={event => set('bio', event.target.value)} placeholder="Share a little about your faith journey and the assignment on your heart." className={`${inputClass} mt-2 h-auto px-4 py-3 leading-6`} />
        </label>
        <div>
          <p className="flex items-center justify-between text-xs font-medium text-foreground/90">Ministry focus <span className={draft.focuses.length >= 5 ? 'font-semibold text-primary' : 'text-muted-foreground'}>{draft.focuses.length} of 5</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...new Set([...FOCUS_OPTIONS, ...draft.focuses])].map(option => {
              const on = draft.focuses.includes(option)
              return (
                <button key={option} type="button" aria-pressed={on} disabled={!on && draft.focuses.length >= 5} onClick={() => set('focuses', on ? draft.focuses.filter(item => item !== option) : [...draft.focuses, option])} className={`h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors disabled:opacity-35 ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:text-foreground'}`}>{option}</button>
              )
            })}
          </div>
        </div>
      </Group>

      <Group title="Where you serve">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" icon={<MapPin className="h-4 w-4" />}><input maxLength={80} value={draft.city} onChange={event => set('city', event.target.value)} placeholder="Lagos" className={`${inputClass} pl-11 pr-4`} /></Field>
          <Field label="Country" icon={<Globe className="h-4 w-4" />}><input maxLength={80} value={draft.country} onChange={event => set('country', event.target.value)} placeholder="Nigeria" className={`${inputClass} pl-11 pr-4`} /></Field>
        </div>
        <Field label="Church or community" icon={<Users className="h-4 w-4" />}><input maxLength={120} value={draft.church} onChange={event => set('church', event.target.value)} placeholder="Your local church" className={`${inputClass} pl-11 pr-4`} /></Field>
        <Field label="Website" icon={<Globe className="h-4 w-4" />} hint={extras ? undefined : 'Run supabase/profile-v2.sql to save a website'}>
          <input type="url" maxLength={200} disabled={!extras} value={draft.website} onChange={event => set('website', event.target.value)} placeholder="https://" className={`${inputClass} pl-11 pr-4`} />
        </Field>
      </Group>

      {/* Account */}
      <Group title="Account">
        <div className="divide-y divide-white/[0.07] overflow-hidden rounded-[20px] border border-white/[0.07]">
          <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email ?? ''} />
          <Link to="/reset-password" className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-white/[0.03]"><span className="text-primary"><Lock className="h-4 w-4" /></span><span className="flex-1 font-medium">Change password</span><ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" /></Link>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-primary">{theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span>
            <span className="flex-1 text-sm font-medium">Appearance</span>
            <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
              {(['light', 'dark'] as const).map(option => <button key={option} type="button" aria-pressed={theme === option} onClick={() => setTheme(option)} className={`h-8 rounded-full px-3.5 text-xs font-semibold capitalize transition-colors ${theme === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{option}</button>)}
            </div>
          </div>
        </div>
        <button type="button" onClick={signOut} className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sign out</button>
      </Group>
    </form>
  )
}

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-8 rounded-[26px] border border-white/[0.07] bg-surface p-5 sm:p-7">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, icon, hint, children }: { label: string; icon: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-foreground/90">
      {label}{hint && <span className="ml-1 text-muted-foreground">({hint})</span>}
      <span className="relative mt-2 block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary">{icon}</span>
        {children}
      </span>
    </label>
  )
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 text-sm">
      <span className="text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="ml-auto truncate text-muted-foreground">{value}</span>
    </div>
  )
}
