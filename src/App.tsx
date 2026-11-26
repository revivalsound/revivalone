import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Landing from './pages/Landing'
import RevivalSplash from './components/RevivalSplash'

// Only the landing page is on the critical path; the app and auth screens
// download when visited (same split as Spyda).
const Auth = lazy(() => import('./pages/Auth'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AppShell = lazy(() => import('./components/app/AppShell'))
const Home = lazy(() => import('./pages/app/Home'))
const Community = lazy(() => import('./pages/app/Community'))
const Events = lazy(() => import('./pages/app/Events'))
const Academy = lazy(() => import('./pages/app/Academy'))
const Word = lazy(() => import('./pages/app/Word'))
const Profile = lazy(() => import('./pages/app/Profile'))
const PostPage = lazy(() => import('./pages/app/PostPage'))
const PublicProfile = lazy(() => import('./pages/app/PublicProfile'))

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
  if (!session) return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />
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
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Splash />
        <Suspense fallback={<ScreenLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/sign-in" element={<Navigate to="/auth" replace />} />
            <Route path="/sign-up" element={<Navigate to="/auth?mode=sign-up" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/community" element={<Community />} />
              <Route path="/events" element={<Events />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/word/:slug" element={<Word />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/u/:id" element={<PublicProfile />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
