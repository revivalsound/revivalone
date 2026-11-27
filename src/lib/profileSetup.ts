import type { User } from '@supabase/supabase-js'

const setupKey = (userId: string) => `revival.profileSetupDismissed:${userId}`
const authRoutes = new Set(['/auth', '/auth/callback', '/sign-in', '/sign-up', '/reset-password', '/onboarding'])

export function safeAppDestination(next: string | null) {
  if (!next?.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/home'
  try {
    const url = new URL(next, 'https://app.invalid')
    const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/'
    if (url.origin !== 'https://app.invalid' || authRoutes.has(path)) return '/home'
    return url.pathname + url.search + url.hash
  } catch {
    return '/home'
  }
}

export function needsProfileSetup(user: Pick<User, 'id' | 'user_metadata'>) {
  if (user.user_metadata.profile_setup !== 'pending') return false
  try {
    return window.localStorage.getItem(setupKey(user.id)) !== '1'
  } catch {
    return true
  }
}

/** Let someone enter the app if an offline or expired session cannot save their skip choice. */
export function dismissProfileSetupLocally(userId: string) {
  try {
    window.localStorage.setItem(setupKey(userId), '1')
  } catch {
    // Onboarding is optional even when the browser disallows storage.
  }
}

export function afterSignIn(user: Pick<User, 'id' | 'user_metadata'>, next: string | null = null) {
  const destination = safeAppDestination(next)
  if (!needsProfileSetup(user)) return destination
  return destination === '/home' ? '/onboarding' : `/onboarding?next=${encodeURIComponent(destination)}`
}
