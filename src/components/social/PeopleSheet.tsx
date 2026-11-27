import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader, Users } from '../ui/icons'
import Sheet from '../ui/Sheet'
import FollowButton from './FollowButton'
import { AuthorAvatar } from '../posts/PostCard'
import { fetchPeople, type Person } from '../../lib/social'

/** Followers or following, with a follow button on each person. */
export default function PeopleSheet({ userId, which, name, onClose }: { userId: string; which: 'followers' | 'following'; name: string; onClose: () => void }) {
  const [people, setPeople] = useState<Person[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { fetchPeople(userId, which).then(setPeople).catch(caught => { setPeople([]); setError(caught instanceof Error ? caught.message : 'We couldn’t load this list.') }) }, [userId, which])

  return (
    <Sheet title={which === 'followers' ? `People following ${name}` : `${name} follows`} onClose={onClose}>
      {people === null ? <div className="flex justify-center py-10"><Loader className="h-5 w-5 animate-spin text-primary" /></div>
        : people.length ? (
          <ul className="space-y-1">
            {people.map(person => (
              <li key={person.id} className="flex items-center gap-3 rounded-[18px] p-2.5 transition-colors hover:bg-white/[0.04]">
                <Link to={`/u/${person.id}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                  <AuthorAvatar author={person} size="h-11 w-11" />
                  <span className="min-w-0">
                    <b className="block truncate text-[14px] font-semibold">{person.full_name || 'Member'}</b>
                    <small className="block truncate text-xs text-muted-foreground">{[person.city, person.church].filter(Boolean).join(' · ') || 'Revival Sound Tent member'}</small>
                  </span>
                </Link>
                <FollowButton userId={person.id} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="h-5 w-5" /></span>
            <p className="mt-4 text-sm text-muted-foreground">{error || (which === 'followers' ? 'No followers yet.' : 'Not following anyone yet.')}</p>
          </div>
        )}
    </Sheet>
  )
}
