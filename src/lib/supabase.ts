import { createClient } from '@supabase/supabase-js'

// The anon key is public by design (row-level security guards the data). These
// fall back to the Revival One project the Next.js build already used.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://yvahpzbkxpgjufnxrisc.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWhwemJreHBnanVmbnhyaXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTQxMzEsImV4cCI6MjEwMDgzMDEzMX0.7lEP0fOch69ByjcKIWeMwU-Bv9uC947RibSaxk-y-W8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** Calls one of the api/ functions with the signed-in user's token. */
export async function api<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init
  const response = await fetch(`/api/${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(body.error ?? 'Something went wrong. Try again.'), { body, status: response.status })
  return body as T
}
