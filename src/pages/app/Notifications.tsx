import { useEffect, useMemo, useState, type ElementType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AtSign, BellBing, BellOff, Check, Fire, HandHeart, Loader, MapPin, PenNew, UserPlus, Users } from '../../components/ui/icons'
import { Notice } from '../../components/ui/kit'
import { AuthorAvatar } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { useNotifications } from '../../lib/notifications'
import { fetchNotifications, markAllRead, markRead, SocialNotReady, subscribeToNotifications, type AppNotification, type NotificationType } from '../../lib/social'
import { timeAgo } from '../../lib/posts'
import { supabase } from '../../lib/supabase'

const TYPE: Record<NotificationType, { icon: ElementType; tint: string }> = {
  follow: { icon: UserPlus, tint: '#ff5c8a' },
  post: { icon: PenNew, tint: '#d7b8ff' },
  prayer_wall: { icon: HandHeart, tint: '#ffb36b' },
  cell: { icon: Users, tint: '#ffd479' },
  cell_nearby: { icon: MapPin, tint: '#8fd3ff' },
  mention: { icon: AtSign, tint: '#ff8fb0' },
}

type Filter = 'all' | 'unread'

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refreshUnread, alerts, enableAlerts, disableAlerts } = useNotifications()
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!user) { setItems([]); return }
    let live = true
    const load = () => fetchNotifications(user.id).then(list => live && setItems(list)).catch(caught => { if (live) { setItems([]); setError(caught instanceof SocialNotReady || caught instanceof Error ? caught.message : 'We couldn’t load notifications.') } })
    void load()
    const channel = subscribeToNotifications(user.id, () => void load())
    return () => { live = false; void supabase.removeChannel(channel) }
  }, [user])

  const shown = (items ?? []).filter(item => filter === 'all' || !item.read_at)
  const unread = (items ?? []).filter(item => !item.read_at).length

  // Today, this week, earlier.
  const groups = useMemo(() => {
    const now = Date.now()
    const buckets: { label: string; items: AppNotification[] }[] = [{ label: 'Today', items: [] }, { label: 'This week', items: [] }, { label: 'Earlier', items: [] }]
    for (const item of shown) {
      const age = now - new Date(item.created_at).getTime()
      const today = new Date(item.created_at).toDateString() === new Date().toDateString()
      buckets[today ? 0 : age < 7 * 86_400_000 ? 1 : 2].items.push(item)
    }
    return buckets.filter(bucket => bucket.items.length)
  }, [shown])

  async function open(item: AppNotification) {
    if (!item.read_at) {
      setItems(current => current?.map(entry => (entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry)) ?? current)
      await markRead([item.id])
      refreshUnread()
    }
    if (item.link) navigate(item.link)
  }

  async function readAll() {
    if (!user) return
    setItems(current => current?.map(entry => ({ ...entry, read_at: entry.read_at ?? new Date().toISOString() })) ?? current)
    await markAllRead(user.id)
    refreshUnread()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Notifications</p>
          <h1 className="font-heading text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[2.4rem]">What’s <span className="text-primary">new.</span></h1>
        </div>
        {unread > 0 && <button type="button" onClick={() => void readAll()} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/[0.1] px-4 text-[13px] font-semibold hover:bg-white/[0.05]"><Check className="h-4 w-4 text-primary" /> Mark all read</button>}
      </header>

      {/* Device alerts */}
      {alerts !== 'unsupported' && (
        <div className="mt-6 flex items-center gap-4 rounded-[22px] border border-white/[0.07] bg-surface p-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${alerts === 'on' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>{alerts === 'on' ? <BellBing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{alerts === 'on' ? 'Device alerts are on' : 'Get alerts on this device'}</p>
            <p className="text-xs text-muted-foreground">{alerts === 'blocked' ? 'Alerts are blocked in your browser settings for this site.' : 'A notification on this phone or computer when someone you follow posts, starts a prayer wall or opens a cell, even when Revival One is closed.'}</p>
          </div>
          {alerts === 'on'
            ? <button type="button" onClick={disableAlerts} className="h-10 shrink-0 rounded-full border border-white/[0.1] px-4 text-[13px] font-semibold">Turn off</button>
            : alerts === 'off' && <button type="button" onClick={() => void enableAlerts()} className="h-10 shrink-0 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground">Turn on</button>}
        </div>
      )}

      <div className="mt-6 inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1" role="tablist">
        {(['all', 'unread'] as const).map(option => (
          <button key={option} type="button" role="tab" aria-selected={filter === option} onClick={() => setFilter(option)} className={`h-9 rounded-full px-4 text-[13px] font-semibold capitalize transition-colors ${filter === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {option}{option === 'unread' && unread ? ` · ${unread}` : ''}
          </button>
        ))}
      </div>

      {error && <div className="mt-6"><Notice tone="error">{error}</Notice></div>}

      {items === null ? (
        <div className="flex justify-center py-16"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
      ) : groups.length ? (
        <div className="mt-6 space-y-7">
          {groups.map(group => (
            <section key={group.label}>
              <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group.label}</h2>
              <ul className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-surface">
                {group.items.map((item, index) => {
                  const meta = TYPE[item.type] ?? TYPE.post
                  return (
                    <li key={item.id} className={index ? 'border-t border-white/[0.06]' : ''} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                      <button type="button" onClick={() => void open(item)} className={`note-row flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] ${item.read_at ? '' : 'bg-primary/[0.05]'}`}>
                        <span className="relative shrink-0">
                          {item.actor ? <AuthorAvatar author={item.actor} size="h-11 w-11" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-primary"><Fire className="h-5 w-5" /></span>}
                          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface" style={{ background: meta.tint, color: '#140609' }}><meta.icon className="h-3 w-3" strokeWidth={2.4} /></span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[14px] leading-5 ${item.read_at ? 'text-foreground/80' : 'font-semibold text-foreground'}`}>{item.title}</span>
                          {item.body && <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{item.body}</span>}
                          <span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(item.created_at)}</span>
                        </span>
                        {!item.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : !error && (
        <div className="mt-8 rounded-[26px] border border-dashed border-white/[0.1] bg-surface/60 px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><BellBing className="h-6 w-6" /></span>
          <h2 className="mt-5 font-heading text-xl font-semibold">{filter === 'unread' ? 'You’re all caught up' : 'Nothing here yet'}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Follow preachers, teachers and friends. When they post, start a prayer wall or open a cell, you’ll hear about it here. New cells in your city show up too.</p>
          <Link to="/home" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Find people in the feed</Link>
        </div>
      )}
    </div>
  )
}
