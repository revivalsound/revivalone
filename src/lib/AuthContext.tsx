import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

type AuthContextValue = {
  loading: boolean
  session: Session | null
  user: User | null
  displayName: string
  initials: string
  avatarUrl: string | null
  /** Re-reads the name and photo from the profile (after an edit or upload). */
  refreshProfile: () => Promise<void>
  /** Updates the name or photo everywhere straight away. */
  setProfileLocally: (patch: Partial<ProfileSummary>) => void
  signOut: () => Promise<void>
}

type ProfileSummary = { full_name: string; avatar_url: string | null }

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const userId = session?.user.id

  // The profiles row is the source of truth for the name and photo shown across the app.
  const refreshProfile = useCallback(async () => {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).maybeSingle()
    if (data) setProfile(data as ProfileSummary)
  }, [userId])

  useEffect(() => { void refreshProfile() }, [refreshProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null
    const displayName = String(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest')
    const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'RO'
    const avatarUrl = profile?.avatar_url ?? (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null)
    return {
      loading,
      session,
      user,
      displayName,
      initials,
      avatarUrl,
      refreshProfile,
      setProfileLocally: patch => setProfile(current => ({ full_name: current?.full_name ?? '', avatar_url: current?.avatar_url ?? null, ...patch })),
      signOut: async () => {
        await supabase.auth.signOut()
        window.location.assign('/')
      },
    }
  }, [loading, session, profile, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
