import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

type AuthContextValue = {
  loading: boolean
  session: Session | null
  user: User | null
  displayName: string
  initials: string
  avatarUrl: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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
    const displayName = String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest')
    const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'RO'
    const avatarUrl = typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null
    return {
      loading,
      session,
      user,
      displayName,
      initials,
      avatarUrl,
      signOut: async () => {
        await supabase.auth.signOut()
        window.location.assign('/')
      },
    }
  }, [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
