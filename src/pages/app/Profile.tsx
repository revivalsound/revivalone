import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Camera, Eye, GraduationCap, Loader, LogOut, MapPin, PlusCircle, Users } from '../../components/ui/icons'
import { Deck, Notice, inputClass } from '../../components/ui/kit'
import { useAuth } from '../../lib/AuthContext'
import { api, supabase } from '../../lib/supabase'
import { shrinkImage } from '../../lib/images'

type Profile = {
  id: string; full_name: string; email: string; city: string; country: string
  church: string; ministry_focus: string; bio: string; avatar_url: string | null
  created_at: string; updated_at: string
}
type Stats = { initiatives: number; events: number; cells: number; courses: number }

const EMPTY: Profile = { id: '', full_name: '', email: '', city: '', country: '', church: '', ministry_focus: '', bio: '', avatar_url: null, created_at: '', updated_at: '' }

const FIELDS: { key: keyof Profile; label: string; placeholder?: string; disabled?: boolean }[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'email', label: 'Email address', disabled: true },
  { key: 'city', label: 'City', placeholder: 'Lagos' },
  { key: 'country', label: 'Country', placeholder: 'Nigeria' },
  { key: 'church', label: 'Church / community', placeholder: 'Your local church' },
  { key: 'ministry_focus', label: 'Ministry focus', placeholder: 'Prayer, missions, business…' },
]

export default function ProfilePage() {
  const { session, user, signOut, setProfileLocally, refreshProfile } = useAuth()
  const [photoStatus, setPhotoStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [stats, setStats] = useState<Stats>({ initiatives: 0, events: 0, cells: 0, courses: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    api<{ profile: Profile; stats: Stats }>('profile', { token: session.access_token })
      .then(body => { setProfile({ ...EMPTY, ...body.profile }); setStats(body.stats) })
      .catch(reason => {
        // Fall back to what the session knows so the page is still useful.
        setProfile(current => ({ ...current, full_name: String(user?.user_metadata?.full_name ?? ''), city: String(user?.user_metadata?.city ?? ''), email: user?.email ?? '' }))
        setError(reason.message)
      })
      .finally(() => setLoading(false))
  }, [session, user])

  const initials = useMemo(() => profile.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'RO', [profile.full_name])
  const location = [profile.city, profile.country].filter(Boolean).join(', ') || 'Add your city'
  const joined = profile.created_at ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at)) : 'recently'

  const update = (key: keyof Profile, value: string) => setProfile(current => ({ ...current, [key]: value }))

  async function save(event?: FormEvent, avatarUrl = profile.avatar_url) {
    event?.preventDefault()
    if (!session) return
    setSaving(true); setError(''); setMessage('')
    try {
      const body = await api<{ profile: Profile }>('profile', { method: 'PATCH', token: session.access_token, body: JSON.stringify({ ...profile, avatar_url: avatarUrl }) })
      setProfile(current => ({ ...current, ...body.profile, email: current.email }))
      setMessage('Your profile has been updated.')
      void refreshProfile()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked || !session || !user) return
    if (!picked.type.startsWith('image/')) { setPhotoStatus({ tone: 'error', text: 'Choose a photo (JPG, PNG or WebP).' }); return }
    setUploading(true); setPhotoStatus(null)
    try {
      // Phone photos are large; shrink to a 640px square first.
      const file = await shrinkImage(picked, { maxSize: 640, square: true })
      const path = `${user.id}/avatar-${Date.now()}.${file.type === 'image/webp' ? 'webp' : 'jpg'}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw new Error(uploadError.message)
      const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      const { error: saveError } = await supabase.from('profiles').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (saveError) throw new Error(saveError.message)
      // Keep the session in step too, then update the photo everywhere.
      await supabase.auth.updateUser({ data: { avatar_url: url } })
      setProfile(current => ({ ...current, avatar_url: url }))
      setProfileLocally({ avatar_url: url })
      setPhotoStatus({ tone: 'ok', text: 'Profile photo updated.' })
    } catch (caught) {
      setPhotoStatus({ tone: 'error', text: caught instanceof Error ? caught.message : 'We couldn’t upload that photo.' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status">
        <span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-surface"><img src="/assets/revival-flame-mark.png" alt="" className="h-7 w-7" /></span>
        <p className="text-sm text-muted-foreground">Preparing your profile…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10">
        <div className="absolute inset-0 hero-field-fallback--vivid" />
        <div className="absolute inset-0 hero-field-scrim--vivid" />
        <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-end sm:p-9">
          <div className="brand-ring brand-ring--on relative h-28 w-28 shrink-0 rounded-full">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#1a0610] font-heading text-3xl font-semibold text-primary">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={`${profile.full_name} profile`} className="h-full w-full object-cover" /> : initials}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-[#7a1438] transition-transform hover:scale-105" title="Change photo">
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="sr-only" />
              {uploading ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <span className="sr-only">Change photo</span>
            </label>
          </div>
          <div className="min-w-0">
            {photoStatus && <p role="status" className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${photoStatus.tone === 'ok' ? 'bg-black/35 text-white' : 'bg-red-500/80 text-white'}`}>{photoStatus.text}</p>}
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Member since {joined}</p>
            <h1 className="mt-2 truncate font-heading text-4xl font-semibold tracking-[-0.02em] text-white">{profile.full_name || 'Your profile'}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" /> {location}</p>
            {(profile.ministry_focus || profile.church) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[profile.ministry_focus, profile.church].filter(Boolean).map(tag => <span key={tag} className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">{tag}</span>)}
              </div>
            )}
          </div>
        </div>
      </section>

      <Deck className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          [CalendarDays, stats.events, 'Events joined'],
          [Users, stats.cells, 'Revival cells'],
          [GraduationCap, stats.courses, 'Courses started'],
          [PlusCircle, stats.initiatives, 'Initiatives created'],
        ] as const).map(([Icon, value, label]) => (
          <article key={label} className="rounded-[22px] border border-white/[0.07] bg-surface p-5">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-4 font-heading text-3xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </article>
        ))}
      </Deck>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={save} className="rounded-[28px] border border-white/[0.07] bg-surface p-6 sm:p-8">
          <h2 className="font-heading text-xl font-semibold">Personal details</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FIELDS.map(field => (
              <label key={field.key} className="block text-xs font-medium text-foreground/90">
                {field.label}
                <input
                  required={field.key === 'full_name'}
                  disabled={field.disabled}
                  value={String(profile[field.key] ?? '')}
                  onChange={event => update(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className={`${inputClass} mt-2 px-4`}
                />
              </label>
            ))}
            <label className="block text-xs font-medium text-foreground/90 sm:col-span-2">
              Bio
              <textarea rows={5} maxLength={500} value={profile.bio} onChange={event => update('bio', event.target.value)} placeholder="Share a little about your faith journey and the assignment on your heart." className={`${inputClass} mt-2 h-auto px-4 py-3`} />
              <span className="mt-1 block text-right text-[11px] text-muted-foreground">{profile.bio.length}/500</span>
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="ok">{message}</Notice>}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" disabled={saving} className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-60">
              {saving ? <><Loader className="h-4 w-4 animate-spin" /> Saving…</> : <>Save changes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
            <small className="text-xs text-muted-foreground">Changes sync securely to your Revival One account.</small>
          </div>
        </form>

        <aside className="h-fit rounded-[28px] border border-white/[0.07] bg-surface-raised p-6">
          <h2 className="font-heading text-xl font-semibold">Account</h2>
          <p className="mt-3 text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{profile.email || user?.email}</p>
          <div className="mt-6 space-y-2">
            {user && <Link to={`/u/${user.id}`} className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"><Eye className="h-4 w-4" /> View public profile</Link>}
            <Link to="/reset-password" className="flex h-11 items-center justify-center rounded-full border border-white/[0.1] bg-surface text-sm font-semibold transition-colors hover:bg-white/[0.07]">Change password</Link>
            <button type="button" onClick={signOut} className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
