import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ThemeProvider } from './lib/theme'
import { NotificationsProvider } from './lib/notifications'
import Landing from './pages/Landing'
import RevivalSplash from './components/RevivalSplash'
import InstallPrompt from './components/InstallPrompt'

// Only the landing page is on the critical path; the app and auth screens
// download when visited (same split as Spyda).
const Auth = lazy(() => import('./pages/Auth'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const AppShell = lazy(() => import('./components/app/AppShell'))
const Home = lazy(() => import('./pages/app/Home'))
const Community = lazy(() => import('./pages/app/Community'))
const Events = lazy(() => import('./pages/app/Events'))
const Academy = lazy(() => import('./pages/app/Academy'))
const BibleReader = lazy(() => import('./pages/app/BibleReader'))
const BibleHome = lazy(() => import('./pages/app/BibleReader').then(module => ({ default: module.BibleHome })))
const DailyGuide = lazy(() => import('./pages/app/DailyGuide'))
const CreateCourse = lazy(() => import('./pages/app/CreateCourse'))
const CreatePost = lazy(() => import('./pages/app/CreatePost'))
const Notifications = lazy(() => import('./pages/app/Notifications'))
const Profile = lazy(() => import('./pages/app/Profile'))
const PostPage = lazy(() => import('./pages/app/PostPage'))
const PublicProfile = lazy(() => import('./pages/app/PublicProfile'))
const CellChat = lazy(() => import('./pages/app/CellChat'))
const PrayerWalls = lazy(() => import('./pages/app/PrayerWalls'))
const PrayerRoom = lazy(() => import('./pages/app/PrayerRoom'))
const CreatePage = lazy(() => import('./pages/app/CreatePage'))
const EditCell = lazy(() => import('./pages/app/CreatePage').then(module => ({ default: module.EditCell })))
const CoursePage = lazy(() => import('./pages/app/CoursePage'))

const SPLASH_SEEN_KEY = 'revival.splashSeen'

/** The brand splash plays once per browser session, not on every reload. */
function shouldShowSplash() {
  try {
    if (window.sessionStorage.getItem(SPLASH_SEEN_KEY)) return false
    window.sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function Splash() {
  const [phase, setPhase] = useState<'on' | 'leaving' | 'off'>(() => (shouldShowSplash() ? 'on' : 'off'))
  // One timer per phase, so moving to 'leaving' doesn't cancel the exit.
  useEffect(() => {
    if (phase === 'off') return
    const timer = window.setTimeout(() => setPhase(phase === 'on' ? 'leaving' : 'off'), phase === 'on' ? 1500 : 280)
    return () => window.clearTimeout(timer)
  }, [phase])
  return phase === 'off' ? null : <RevivalSplash leaving={phase === 'leaving'} />
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <ScreenLoader />
  if (!session) {
    const next = location.pathname === '/onboarding'
      ? new URLSearchParams(location.search).get('next') || '/home'
      : location.pathname + location.search + location.hash
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />
  }
  return <>{children}</>
}

function ScreenLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="brand-ring brand-ring--on flex h-14 w-14 items-center justify-center rounded-full bg-surface">
        <img src="/assets/revival-flame-mark.png" alt="" className="h-7 w-7 object-contain" />
      </span>
    </div>
  )
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
      <NotificationsProvider>
        <ScrollToTop />
        <Splash />
        <InstallPrompt />
        <Suspense fallback={<ScreenLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/sign-in" element={<Navigate to="/auth" replace />} />
            <Route path="/sign-up" element={<Navigate to="/auth?mode=sign-up" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/community" element={<Navigate to="/community/cells" replace />} />
              <Route path="/community/cells" element={<Community />} />
              <Route path="/community/cells/:id" element={<CellChat />} />
              <Route path="/community/cells/:id/edit" element={<RequireAuth><EditCell /></RequireAuth>} />
              <Route path="/community/prayer" element={<PrayerWalls />} />
              <Route path="/prayer/:code" element={<PrayerRoom />} />
              <Route path="/create/post" element={<RequireAuth><CreatePost /></RequireAuth>} />
              <Route path="/create/course" element={<RequireAuth><CreateCourse /></RequireAuth>} />
              <Route path="/create/:kind" element={<RequireAuth><CreatePage /></RequireAuth>} />
              <Route path="/events" element={<Events />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/:slug" element={<CoursePage />} />
              <Route path="/bible" element={<BibleHome />} />
              <Route path="/bible/:translation/:book/:chapter" element={<BibleReader />} />
              <Route path="/guide" element={<DailyGuide />} />
              <Route path="/guide/:day" element={<DailyGuide />} />
              <Route path="/word/*" element={<Navigate to="/guide" replace />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/u/:id" element={<PublicProfile />} />
              <Route path="/profile" element={<RequireAuth><PublicProfile self /></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
              <Route path="/profile/edit" element={<RequireAuth><Profile /></RequireAuth>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </NotificationsProvider>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
