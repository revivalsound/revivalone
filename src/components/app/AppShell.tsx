import { createContext, useContext, useEffect, useRef, useState, type ElementType, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bible,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Fire,
  GraduationCap,
  HandHeart,
  Home,
  Loader,
  LogOut,
  PanelLeft,
  Plus,
  Sunrise,
  User,
  Users,
  X,
} from '../ui/icons'
import AmbientField from '../AmbientField'
import BrandMark from '../brand/BrandMark'
import { Notice, inputClass } from '../ui/kit'
import { useAuth } from '../../lib/AuthContext'
import { api } from '../../lib/supabase'
import { TODAYS_WORD } from '../../lib/content'

/* ── Create flow, shared by every screen ── */

const CREATION_TYPES = [
  { kind: 'event', title: 'Event', copy: 'A worship night, outreach or conference.', icon: CalendarDays },
  { kind: 'bootcamp', title: 'Gospel bootcamp', copy: 'An intensive track for evangelism, prayer or leadership.', icon: Fire },
  { kind: 'cell', title: 'Revival cell', copy: 'A local group that meets, grows and serves together.', icon: Users },
] as const

export type CreationKind = typeof CREATION_TYPES[number]['kind']
const CreateContext = createContext<(kind?: CreationKind) => void>(() => undefined)
export const useCreate = () => useContext(CreateContext)

function CreateDialog({ initialKind, onClose }: { initialKind?: CreationKind; onClose: () => void }) {
  const { session } = useAuth()
  const dialog = useRef<HTMLDialogElement>(null)
  const [kind, setKind] = useState<CreationKind | undefined>(initialKind)
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState('')
  const selected = CREATION_TYPES.find(type => type.kind === kind)

  useEffect(() => { dialog.current?.showModal() }, [])

  const close = () => { if (!saving) dialog.current?.close() }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !kind || saving) return
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      await api('initiatives', {
        method: 'POST',
        token: session.access_token,
        body: JSON.stringify({ kind, title: form.get('title'), city: form.get('city'), startsAt: form.get('startsAt'), description: form.get('description') }),
      })
      setCreated(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t save your draft. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="revival-dialog" aria-labelledby="create-title" onClose={onClose} onCancel={event => { if (saving) event.preventDefault() }}>
      <div className="dialog-in fixed inset-x-0 bottom-0 m-auto w-full max-w-lg rounded-t-[28px] border glass glass-strong p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-0 sm:h-fit sm:rounded-[28px] sm:p-7">
        <button type="button" onClick={close} disabled={saving} aria-label="Close" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {created ? (
          <div className="py-6 text-center">
            <span className="brand-ring brand-ring--on mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-7 w-7" strokeWidth={2.4} /></span>
            <h2 id="create-title" className="mt-5 font-heading text-2xl font-semibold">Draft saved</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your {selected?.title.toLowerCase()} was saved to your account.</p>
            <button type="button" onClick={close} className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">Done</button>
          </div>
        ) : !session ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Plus className="h-6 w-6" /></span>
            <h2 id="create-title" className="mt-5 font-heading text-2xl font-semibold">Sign in to start something</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">Events, bootcamps and cells are saved to your Revival One account.</p>
            <Link to="/auth" onClick={close} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : selected ? (
          <form onSubmit={submit} className="space-y-4">
            <button type="button" disabled={saving} onClick={() => { setKind(undefined); setError('') }} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><ChevronLeft className="h-3.5 w-3.5" /> Choose another type</button>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><selected.icon className="h-5 w-5" /></span>
              <h2 id="create-title" className="font-heading text-2xl font-semibold">Create a {selected.title.toLowerCase()}</h2>
            </div>
            <label className="block text-xs font-medium text-foreground/90">Name<input required name="title" minLength={3} maxLength={120} placeholder={selected.title} className={`${inputClass} mt-2 px-4`} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-foreground/90">City<input required name="city" minLength={2} maxLength={100} placeholder="Lagos, Nigeria" className={`${inputClass} mt-2 px-4`} /></label>
              <label className="block text-xs font-medium text-foreground/90">Start date<input required name="startsAt" type="date" className={`${inputClass} mt-2 px-4 [color-scheme:dark]`} /></label>
            </div>
            <label className="block text-xs font-medium text-foreground/90">Description<textarea required name="description" minLength={10} maxLength={1000} rows={4} placeholder="What will happen, and who is it for?" className={`${inputClass} mt-2 h-auto px-4 py-3`} /></label>
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60">
              {saving ? <><Loader className="h-4 w-4 animate-spin" /> Saving…</> : 'Save draft'}
            </button>
          </form>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Create</p>
            <h2 id="create-title" className="mt-2 font-heading text-2xl font-semibold">What are you starting?</h2>
            <div className="mt-6 space-y-2.5">
              {CREATION_TYPES.map(({ kind: type, title, copy, icon: Icon }) => (
                <button type="button" key={type} onClick={() => setKind(type)} className="bolt-card bolt-card--hover group flex w-full items-center gap-4 rounded-[20px] border border-white/[0.07] bg-surface p-4 text-left transition-colors hover:bg-surface-raised">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><b className="block font-heading text-[15px] font-semibold">{title}</b><small className="text-xs text-muted-foreground">{copy}</small></span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}

/* ── Navigation ── */

type NavItem = { to: string; label: string; icon: ElementType }

const NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/academy', label: 'Academy', icon: GraduationCap },
]

const SECONDARY: NavItem[] = [
  { to: `/word/${TODAYS_WORD.slug}`, label: 'Today’s Word', icon: Bible },
  { to: '/community#prayer-wall', label: 'Prayer wall', icon: HandHeart },
]

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { pathname } = useLocation()
  const active = pathname === item.to.split('#')[0] && !item.to.includes('#')
  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-2.5 rounded-[10px] transition-all duration-200 ${collapsed ? 'h-10 w-10 justify-center' : 'px-2.5 py-2'} ${active ? 'bg-primary/[0.08] text-primary' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'}`}
    >
      <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#1a0610] ring-2 ring-primary shadow-[0_6px_16px_rgba(255,92,138,0.25)]' : ''}`}>
        <item.icon className="h-[17px] w-[17px]" />
      </span>
      {!collapsed && <span className="truncate text-[13px] font-medium tracking-wide">{item.label}</span>}
    </Link>
  )
}

function Avatar({ size = 'h-8 w-8' }: { size?: string }) {
  const { avatarUrl, initials } = useAuth()
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff5c8a] to-[#e11d5c] font-heading text-[11px] font-bold text-primary-foreground`}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  )
}

const SECTION_TITLES: Record<string, string> = { '/home': 'Home', '/community': 'Community', '/events': 'Events', '/academy': 'Academy', '/profile': 'Profile' }

export default function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, displayName, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem('revival.rail') === '1' } catch { return false }
  })
  const [creating, setCreating] = useState<{ kind?: CreationKind } | null>(null)

  useEffect(() => { try { window.localStorage.setItem('revival.rail', collapsed ? '1' : '0') } catch { /* storage unavailable */ } }, [collapsed])

  const section = SECTION_TITLES[pathname]
    ?? (pathname.startsWith('/word') ? 'Today’s Word' : pathname.startsWith('/post') ? 'Post' : pathname.startsWith('/u/') ? 'Member' : 'Revival One')
  const openCreate = (kind?: CreationKind) => setCreating({ kind })

  return (
    <CreateContext.Provider value={openCreate}>
      <div className="relative flex min-h-[100dvh] bg-background font-sans text-foreground">
        <AmbientField intensity={0.8} className="fixed" />

        {/* Sidebar: full list or icon rail (Spyda's workspace sidebar) */}
        <aside className={`sticky top-0 z-30 hidden h-[100dvh] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0607]/95 py-4 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex ${collapsed ? 'w-[68px] items-center px-2' : 'w-[248px] px-3'}`}>
          <Link to="/" className={`mb-5 flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/[0.04] ${collapsed ? 'justify-center' : ''}`} aria-label="Revival One home">
            <BrandMark size={30} animated />
            {!collapsed && <span className="flex flex-col"><span className="font-heading text-[14px] font-semibold leading-none">Revival One</span><span className="mt-1 text-[11px] leading-none text-muted-foreground">One movement</span></span>}
          </Link>

          <nav aria-label="App" className={`flex flex-1 flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
            {NAV.map(item => <SideLink key={item.to} item={item} collapsed={collapsed} />)}
            {!collapsed && <p className="mb-1 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">Daily</p>}
            {collapsed && <span className="my-3 h-px w-8 bg-white/[0.06]" />}
            {SECONDARY.map(item => <SideLink key={item.to} item={item} collapsed={collapsed} />)}
          </nav>

          <div className={`flex flex-col gap-2 border-t border-white/[0.06] pt-3 ${collapsed ? 'items-center' : ''}`}>
            <button type="button" onClick={() => openCreate()} title="Create" className={`inline-flex items-center justify-center gap-2 rounded-full bg-primary font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_10px_30px_rgba(255,92,138,0.22)] transition-all hover:-translate-y-0.5 active:scale-[0.98] ${collapsed ? 'h-10 w-10' : 'h-11 w-full'}`}>
              <Plus className="h-4 w-4" strokeWidth={2.4} />{!collapsed && 'Create'}
            </button>
            {user ? (
              <div className={`flex items-center gap-2 rounded-[12px] ${collapsed ? 'flex-col' : 'p-1.5 hover:bg-white/[0.04]'}`}>
                <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2.5" aria-label="Open your profile" title={collapsed ? displayName : undefined}>
                  <Avatar />
                  {!collapsed && <span className="min-w-0"><span className="block truncate text-[13px] font-medium">{displayName}</span><span className="block truncate text-[11px] text-muted-foreground">View profile</span></span>}
                </Link>
                <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"><LogOut className="h-4 w-4" /></button>
              </div>
            ) : (
              <Link to="/auth" title="Sign in" className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-surface-raised text-[12px] font-semibold transition-colors hover:bg-white/[0.07] ${collapsed ? 'h-10 w-10' : 'h-11 w-full'}`}>
                <User className="h-4 w-4 text-primary" />{!collapsed && 'Sign in'}
              </Link>
            )}
          </div>
        </aside>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#070405]/80 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
              <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground lg:flex"><PanelLeft className="h-4 w-4" /></button>
              <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="Revival One home"><BrandMark size={26} animated /><span className="font-heading text-[15px] font-semibold">Revival One</span></Link>
              <span className="hidden text-muted-foreground lg:inline">Revival One</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/40 lg:block" />
              <span className="hidden truncate font-semibold lg:inline">{section}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/word/${TODAYS_WORD.slug}`} className="hidden h-8 items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 text-[12px] font-medium text-foreground/85 transition-colors hover:bg-white/[0.07] sm:inline-flex"><Sunrise className="h-3.5 w-3.5 text-primary" /> Today’s Word</Link>
              {user
                ? <Link to="/profile" aria-label="Open your profile"><Avatar /></Link>
                : <button type="button" onClick={() => navigate('/auth')} className="inline-flex h-8 items-center rounded-full bg-primary px-3.5 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Sign in</button>}
            </div>
          </header>

          <main id="app-content" className="flex-1 pb-28 lg:pb-12">
            <div key={pathname} className="page-enter"><Outlet /></div>
          </main>
        </div>

        {/* Phone navigation with the create button in the middle */}
        <nav aria-label="App" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-[#0a0607]/90 px-2 pt-2 backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 items-end">
            {NAV.slice(0, 2).map(item => <MobileLink key={item.to} item={item} />)}
            <div className="flex justify-center">
              <button type="button" onClick={() => openCreate()} aria-label="Create" className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(255,92,138,0.4)] ring-4 ring-background transition-transform active:scale-95"><Plus className="h-6 w-6" strokeWidth={2.4} /></button>
            </div>
            {NAV.slice(2).map(item => <MobileLink key={item.to} item={item} />)}
          </div>
        </nav>

        {creating && <CreateDialog initialKind={creating.kind} onClose={() => setCreating(null)} />}
      </div>
    </CreateContext.Provider>
  )
}

function MobileLink({ item }: { item: NavItem }) {
  return (
    <NavLink to={item.to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
      <item.icon className="h-5 w-5" />
      {item.label}
    </NavLink>
  )
}

/** The page header used on every in-app screen. */
export function PageHeader({ eyebrow, title, lede, action }: { eyebrow: string; title: ReactNode; lede: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-4 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {eyebrow}</p>
        <h1 className="font-heading text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">{lede}</p>
      </div>
      {action}
    </header>
  )
}

export function CreateButton({ kind, children }: { kind?: CreationKind; children: ReactNode }) {
  const create = useCreate()
  return (
    <button type="button" onClick={() => create(kind)} className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-primary pl-5 pr-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.24)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] sm:self-auto">
      {children}
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#070405] text-primary transition-transform group-hover:rotate-90"><Plus className="h-4 w-4" strokeWidth={2.4} /></span>
    </button>
  )
}
