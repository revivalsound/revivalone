import { createContext, useContext, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bible,
  CalendarDays,
  ChevronRight,
  Fire,
  GraduationCap,
  HandHeart,
  Home,
  LogOut,
  Moon,
  BellBing,
  PanelLeft,
  PenNew,
  Plus,
  Sun,
  Sunrise,
  User,
  Users,
  X,
} from '../ui/icons'
import AmbientField from '../AmbientField'
import PhotoImg from '../ui/PhotoImg'
import BrandMark from '../brand/BrandMark'
import { useAuth } from '../../lib/AuthContext'
import { useTheme } from '../../lib/theme'
import { useNotifications } from '../../lib/notifications'

/* ── Create flow, shared by every screen ── */

const CREATION_TYPES = [
  { kind: 'post', title: 'Revival post', copy: 'A word, study, question or Kingdom opportunity for the feed.', icon: PenNew },
  { kind: 'event', title: 'Event', copy: 'A worship night, outreach or conference.', icon: CalendarDays },
  { kind: 'bootcamp', title: 'Gospel bootcamp', copy: 'An intensive track for evangelism, prayer or leadership.', icon: Fire },
  { kind: 'cell', title: 'Revival cell', copy: 'A local group that meets, grows and serves together.', icon: Users },
  { kind: 'course', title: 'Rev Academy course', copy: 'Teach an audio course, episode by episode.', icon: GraduationCap },
] as const

export type CreationKind = typeof CREATION_TYPES[number]['kind']
const CreateContext = createContext<(kind?: CreationKind) => void>(() => undefined)
export const useCreate = () => useContext(CreateContext)

/** The + menu: pick what to create. Each type has its own page; posts use the composer. */
function CreateDialog({ onPick, onClose }: { onPick: (kind: CreationKind) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])

  return (
    <dialog ref={dialog} className="revival-dialog" aria-labelledby="create-title" onClose={onClose}>
      <div className="dialog-in fixed inset-x-0 bottom-0 m-auto w-full max-w-lg rounded-t-[28px] border glass glass-strong p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-0 sm:h-fit sm:rounded-[28px] sm:p-7">
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Create</p>
        <h2 id="create-title" className="mt-2 font-heading text-2xl font-semibold">What are you starting?</h2>
        <div className="mt-6 space-y-2.5">
          {CREATION_TYPES.map(({ kind, title, copy, icon: Icon }) => (
            <button type="button" key={kind} onClick={() => { dialog.current?.close(); onPick(kind) }} className="bolt-card bolt-card--hover group flex w-full items-center gap-4 rounded-[20px] border border-white/[0.07] bg-surface p-4 text-left transition-colors hover:bg-surface-raised">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${kind === 'post' ? 'bg-primary text-primary-foreground' : 'border border-primary/25 bg-primary/10 text-primary'}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><b className="block font-heading text-[15px] font-semibold">{title}</b><small className="text-xs text-muted-foreground">{copy}</small></span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </dialog>
  )
}

/* ── Navigation ── */

type NavItem = { to: string; label: string; icon: ElementType }

const NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/bible', label: 'Bible', icon: Bible },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/academy', label: 'Academy', icon: GraduationCap },
]

const SECONDARY: NavItem[] = [
  { to: '/guide', label: 'Daily guide', icon: Sunrise },
  { to: '/community/prayer', label: 'Prayer wall', icon: HandHeart },
]

// Phones: four tabs around the create button.
const MOBILE: NavItem[] = [NAV[0], NAV[1], NAV[2], NAV[4]]

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { pathname } = useLocation()
  // Sections own their sub-pages (a course under Academy, a cell chat under Community),
  // except the prayer wall, which has its own sidebar entry.
  const active = pathname === item.to
    || (item.to !== '/home' && pathname.startsWith(`${item.to}/`) && !(item.to === '/community' && pathname.startsWith('/community/prayer')))
    || (item.to === '/community/prayer' && pathname.startsWith('/prayer/'))
  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-2.5 rounded-[10px] transition-all duration-200 ${collapsed ? 'h-10 w-10 justify-center' : 'px-2.5 py-2'} ${active ? 'bg-primary/[0.08] text-primary' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'}`}
    >
      <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? 'bg-plum ring-2 ring-primary shadow-[0_6px_16px_rgba(255,92,138,0.25)]' : ''}`}>
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
      {avatarUrl ? <PhotoImg src={avatarUrl} fallback={initials} /> : initials}
    </span>
  )
}

const SECTION_TITLES: Record<string, string> = { '/home': 'Home', '/notifications': 'Notifications', '/guide': 'Daily guide', '/community/cells': 'Revival cells', '/community/prayer': 'Prayer wall', '/events': 'Events', '/academy': 'Academy', '/profile': 'Profile' }

export default function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, displayName, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem('revival.rail') === '1' } catch { return false }
  })
  const [picking, setPicking] = useState(false)

  useEffect(() => { try { window.localStorage.setItem('revival.rail', collapsed ? '1' : '0') } catch { /* storage unavailable */ } }, [collapsed])

  const section = SECTION_TITLES[pathname]
    ?? (pathname === '/profile/edit' ? 'Edit profile' : pathname.startsWith('/bible') ? 'Bible' : pathname.startsWith('/guide') ? 'Daily guide' : pathname.startsWith('/post') ? 'Post' : pathname.startsWith('/u/') ? 'Member'
      : pathname.startsWith('/community/cells/') ? 'Cell chat' : pathname.startsWith('/prayer/') ? 'Prayer wall' : pathname.startsWith('/create/') ? 'Create'
      : pathname.startsWith('/academy/') ? 'Course' : 'Revival One')
  const openCreate = (kind?: CreationKind) => {
    if (!kind) setPicking(true)
    else navigate(`/create/${kind}`)
  }

  return (
    <CreateContext.Provider value={openCreate}>
      <div className="relative flex min-h-[100dvh] bg-background font-sans text-foreground">
        <AmbientField intensity={0.8} className="fixed" />

        {/* Sidebar: full list or icon rail (Spyda's workspace sidebar) */}
        <aside className={`sticky top-0 z-30 hidden h-[100dvh] shrink-0 flex-col border-r border-white/[0.06] bg-shell py-4 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex ${collapsed ? 'w-[68px] items-center px-2' : 'w-[248px] px-3'}`}>
          <Link to="/" className={`mb-5 flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/[0.04] ${collapsed ? 'justify-center' : ''}`} aria-label="Revival One home">
            <BrandMark size={30} animated />
            {!collapsed && <span className="flex flex-col"><span className="font-heading text-[14px] font-semibold leading-none">Revival One</span><span className="mt-1 text-[11px] leading-none text-muted-foreground">One movement</span></span>}
          </Link>

          <nav aria-label="App" className={`flex flex-1 flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
            {NAV.map(item => <SideLink key={item.to} item={item} collapsed={collapsed} />)}
            {!collapsed && <p className="mb-1 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">Daily</p>}
            {collapsed && <span className="my-3 h-px w-8 bg-white/[0.06]" />}
            {SECONDARY.map(item => <SideLink key={item.to} item={item} collapsed={collapsed} />)}
            {user && <NotificationsLink collapsed={collapsed} />}
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
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-shell px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
              <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground lg:flex"><PanelLeft className="h-4 w-4" /></button>
              <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="Revival One home"><BrandMark size={26} animated /><span className="font-heading text-[15px] font-semibold">Revival One</span></Link>
              <span className="hidden text-muted-foreground lg:inline">Revival One</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/40 lg:block" />
              <span className="hidden truncate font-semibold lg:inline">{section}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user && <BellButton />}
              <Link to="/guide" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 text-[12px] font-medium text-foreground/85 transition-colors hover:bg-white/[0.07]"><Sunrise className="h-3.5 w-3.5 text-primary" /> <span className="hidden sm:inline">Today’s guide</span></Link>
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
        <nav aria-label="App" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-shell px-2 pt-2 lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 items-end">
            {MOBILE.slice(0, 2).map(item => <MobileLink key={item.to} item={item} />)}
            <div className="flex justify-center">
              <button type="button" onClick={() => openCreate()} aria-label="Create" className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(255,92,138,0.4)] ring-4 ring-background transition-transform active:scale-95"><Plus className="h-6 w-6" strokeWidth={2.4} /></button>
            </div>
            {MOBILE.slice(2).map(item => <MobileLink key={item.to} item={item} />)}
          </div>
        </nav>

        {picking && <CreateDialog onPick={kind => openCreate(kind)} onClose={() => setPicking(false)} />}
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
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-shell text-primary transition-transform group-hover:rotate-90"><Plus className="h-4 w-4" strokeWidth={2.4} /></span>
    </button>
  )
}

/** Switches between the light and dark themes; the choice is saved on this device. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const light = theme === 'light'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
      className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-white/[0.03] text-foreground/85 transition-colors hover:bg-white/[0.07] ${className}`}
    >
      <Sun className={`absolute h-4 w-4 text-primary transition-all duration-300 ${light ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
      <Moon className={`absolute h-4 w-4 text-primary transition-all duration-300 ${light ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
    </button>
  )
}

/** The bell in the top bar: a live unread badge, and a little ring when something new arrives. */
function BellButton() {
  const { unread } = useNotifications()
  const [ring, setRing] = useState(false)
  const previous = useRef(unread)
  useEffect(() => {
    if (unread > previous.current) { setRing(true); const timer = window.setTimeout(() => setRing(false), 950); previous.current = unread; return () => window.clearTimeout(timer) }
    previous.current = unread
  }, [unread])
  return (
    <Link to="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-foreground/85 transition-colors hover:bg-white/[0.07]">
      <BellBing className={`h-4 w-4 text-primary ${ring ? 'bell-ring' : ''}`} />
      {unread > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-heading text-[10px] font-bold text-primary-foreground ring-2 ring-shell">{unread > 99 ? '99+' : unread}</span>}
    </Link>
  )
}

/** Sidebar entry for notifications, with the unread count. */
function NotificationsLink({ collapsed }: { collapsed: boolean }) {
  const { unread } = useNotifications()
  const { pathname } = useLocation()
  const active = pathname === '/notifications'
  return (
    <Link to="/notifications" title={collapsed ? 'Notifications' : undefined} aria-current={active ? 'page' : undefined} className={`group relative flex items-center gap-2.5 rounded-[10px] transition-all duration-200 ${collapsed ? 'h-10 w-10 justify-center' : 'px-2.5 py-2'} ${active ? 'bg-primary/[0.08] text-primary' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'}`}>
      <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? 'bg-plum ring-2 ring-primary' : ''}`}><BellBing className="h-[17px] w-[17px]" /></span>
      {!collapsed && <span className="flex-1 truncate text-[13px] font-medium tracking-wide">Notifications</span>}
      {unread > 0 && <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-heading text-[10px] font-bold text-primary-foreground ${collapsed ? 'absolute -right-0.5 -top-0.5' : ''}`}>{unread > 99 ? '99+' : unread}</span>}
    </Link>
  )
}
