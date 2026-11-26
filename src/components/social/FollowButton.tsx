import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, UserCheck, UserPlus } from '../ui/icons'
import { useAuth } from '../../lib/AuthContext'
import { follow, isFollowing, unfollow } from '../../lib/social'

/** Follow / Following toggle. Optimistic; reverts if the save fails. */
export default function FollowButton({ userId, size = 'md', onChange }: { userId: string; size?: 'sm' | 'md'; onChange?: (following: boolean) => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [following, setFollowing] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pop, setPop] = useState(false)

  useEffect(() => {
    if (!user || user.id === userId) { setFollowing(false); return }
    isFollowing(user.id, userId).then(setFollowing).catch(() => setFollowing(false))
  }, [user, userId])

  if (user?.id === userId) return null

  async function toggle() {
    if (!user) { navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`); return }
    if (following === null || busy) return
    const next = !following
    setFollowing(next); setBusy(true); setError('')
    if (next) { setPop(true); window.setTimeout(() => setPop(false), 600) }
    try {
      if (next) await follow(user.id, userId)
      else await unfollow(user.id, userId)
      onChange?.(next)
    } catch (caught) {
      setFollowing(!next)
      setError(caught instanceof Error ? caught.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  const sizes = size === 'sm' ? 'h-9 px-3.5 text-xs' : 'h-11 px-5 text-[13px]'
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={Boolean(following)}
        title={error || undefined}
        className={`group inline-flex shrink-0 items-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-[0.97] ${sizes} ${following
          ? 'border border-white/[0.14] bg-surface text-foreground hover:border-red-400/50 hover:text-red-400'
          : 'bg-primary text-primary-foreground shadow-[0_10px_26px_rgba(255,92,138,0.3)] hover:-translate-y-0.5'} ${pop ? 'follow-pop' : ''}`}
      >
        {following === null || busy && following === null ? <Loader className="h-4 w-4 animate-spin" /> : following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {following ? <><span className="group-hover:hidden">Following</span><span className="hidden group-hover:inline">Unfollow</span></> : 'Follow'}
      </button>
      {error && <span className="absolute left-0 top-full mt-1 w-56 text-[11px] text-red-400">{error}</span>}
    </span>
  )
}
