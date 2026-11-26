import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

declare const process: { env: Record<string, string | undefined> }

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'https://yvahpzbkxpgjufnxrisc.supabase.co'
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWhwemJreHBnanVmbnhyaXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTQxMzEsImV4cCI6MjEwMDgzMDEzMX0.7lEP0fOch69ByjcKIWeMwU-Bv9uC947RibSaxk-y-W8'

export function bearerToken(req: any) {
  const value = String(req.headers?.authorization ?? '')
  return value.startsWith('Bearer ') ? value.slice(7) : ''
}

/** A Supabase client acting as the signed-in user (row-level security applies). */
export async function authenticated(req: any): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const token = bearerToken(req)
  if (!token) return null
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { supabase, user: data.user }
}
