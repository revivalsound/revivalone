import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/brand/BrandMark'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Confirming your Revival One account…')

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    const complete = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setMessage(error.message); return }
      } else {
        await new Promise(resolve => window.setTimeout(resolve, 500))
      }
      const { data } = await supabase.auth.getSession()
      navigate(data.session ? '/home' : '/auth', { replace: true })
    }
    void complete()
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
