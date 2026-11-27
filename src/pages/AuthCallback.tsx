import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/brand/BrandMark'
import { supabase } from '../lib/supabase'
import { afterSignIn } from '../lib/profileSetup'

async function completeSignIn() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    if (data.session) return afterSignIn(data.session.user, params.get('next'))
  } else {
    await new Promise(resolve => window.setTimeout(resolve, 500))
  }
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session ? afterSignIn(data.session.user, params.get('next')) : '/auth'
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Confirming your Revival Sound Tent account…')
  const completion = useRef<Promise<string> | null>(null)

  useEffect(() => {
    let active = true
    completion.current ??= completeSignIn()
    void completion.current.then(destination => {
      if (active) navigate(destination, { replace: true })
    }, error => {
      if (active) setMessage(error instanceof Error ? error.message : 'Couldn’t confirm your account. Try signing in.')
    })
    return () => { active = false }
  }, [navigate])

  return (
    <main className="theme-dark grid min-h-[100dvh] place-items-center bg-[radial-gradient(ellipse_at_50%_58%,#2a0c17,hsl(var(--background))_55%)] p-6 text-center">
      <div>
        <span className="brand-ring brand-ring--on mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-surface"><BrandMark size={52} animated /></span>
        <p role="status" className="mt-6 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  )
}
