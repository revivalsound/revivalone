import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader, Lock } from '../components/ui/icons'
import BrandMark from '../components/brand/BrandMark'
import { Notice, inputClass } from '../components/ui/kit'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function updatePassword(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return }
    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    navigate('/home')
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(60%_50%_at_50%_0%,rgba(176,32,79,0.28),transparent_70%)] px-5 py-10">
      <div className="w-full max-w-[400px]">
        <Link to="/auth" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
        <div className="mt-10 text-center">
          <span className="brand-ring brand-ring--on mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface"><BrandMark size={44} animated /></span>
          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Make a fresh start</p>
          <h1 className="mt-2.5 font-heading text-[2rem] font-semibold leading-tight tracking-[-0.02em]">Choose a new password.</h1>
          <p className="mt-2.5 text-sm leading-6 text-muted-foreground">Use at least eight characters for your Revival One account.</p>
        </div>
        <form onSubmit={updatePassword} className="mt-8 space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input required minLength={8} type="password" autoComplete="new-password" aria-label="New password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" className={`${inputClass} pl-11 pr-4`} />
          </div>
          <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50">
            {loading ? <Loader className="h-5 w-5 animate-spin" /> : <>Update password <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        <div className="mt-10 flex justify-center opacity-60"><BrandMark size={22} /></div>
      </div>
    </main>
  )
}
