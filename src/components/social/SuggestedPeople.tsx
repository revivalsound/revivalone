import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from '../ui/icons'
import FollowButton from './FollowButton'
import { AuthorAvatar } from '../posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { fetchSuggestedPeople, type Person } from '../../lib/social'

/** Members to follow, so the feed and notifications have something in them. */
export default function SuggestedPeople({ limit = 6, title = 'People to follow', compact = false }: { limit?: number; title?: string; compact?: boolean }) {
  const { user } = useAuth()
  const [people, setPeople] = useState<Person[] | null>(null)
  useEffect(() => { if (user) fetchSuggestedPeople(user.id, limit).then(setPeople).catch(() => setPeople([])) }, [user, limit])
  if (!user || !people?.length) return null

  return (
    <section aria-label={title} className={`rounded-[24px] border border-white/[0.07] bg-surface ${compact ? 'p-5' : 'p-5 sm:p-6'}`}>
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><UserPlus className="h-4 w-4 text-primary" /> {title}</p>
      <ul className="mt-3 space-y-1">
        {people.map(person => (
          <li key={person.id} className="flex items-center gap-3 rounded-[16px] p-1.5 transition-colors hover:bg-white/[0.04]">
            <Link to={`/u/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <AuthorAvatar author={person} size={compact ? 'h-9 w-9' : 'h-11 w-11'} />
              <span className="min-w-0">
                <b className="block truncate text-[13px] font-semibold">{person.full_name}</b>
                <small className="block truncate text-[11px] text-muted-foreground">{[person.city, person.church].filter(Boolean).join(' · ') || 'Revival One member'}</small>
              </span>
            </Link>
            <FollowButton userId={person.id} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  )
}
