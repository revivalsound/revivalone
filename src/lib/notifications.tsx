import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { fetchNotification, markRead, subscribeToNotifications, unreadCount, type AppNotification } from './social'
import { supabase } from './supabase'

const ALERTS_KEY = 'revival.alerts'
// The public half of the push key pair (safe to ship; the private half lives only in Vercel).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? 'BIOm0jNf8GNK26jSYLGklog7CfJWTM-jCeqAY810dkRVmC54Wc5QWyaD0ExaVjaHvLuxv55l-N7R1TwNeHq3qWA'

function keyBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0))
}

/** Signs this device up for push and saves it to the member's account. */
async function subscribeDevice(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = (await registration.pushManager.getSubscription())
    ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) })
  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  await supabase.from('push_subscriptions').upsert({ user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' })
}

async function unsubscribeDevice() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

type Value = {
  unread: number
  refreshUnread: () => void
  /** Device alerts: shown as system notifications while Revival One is open in the background. */
  alerts: 'on' | 'off' | 'blocked' | 'unsupported'
  enableAlerts: () => Promise<void>
  disableAlerts: () => void
}

const NotificationsContext = createContext<Value>({ unread: 0, refreshUnread: () => undefined, alerts: 'off', enableAlerts: async () => undefined, disableAlerts: () => undefined })
export const useNotifications = () => useContext(NotificationsContext)

function alertsState(): Value['alerts'] {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  let saved = ''
  try { saved = window.localStorage.getItem(ALERTS_KEY) ?? '' } catch { /* storage unavailable */ }
  return Notification.permission === 'granted' && saved !== 'off' ? 'on' : 'off'
}

/**
 * Keeps the unread count live, shows a toast when something new arrives, and
 * (if allowed) a device notification when the app is in the background.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState<AppNotification | null>(null)
  const [alerts, setAlerts] = useState<Value['alerts']>(alertsState)

  const refreshUnread = useCallback(() => { if (user) void unreadCount(user.id).then(setUnread) }, [user])

  useEffect(() => {
    if (!user) { setUnread(0); return }
    refreshUnread()
    const channel = subscribeToNotifications(user.id, async id => {
      setUnread(count => count + 1)
      const note = await fetchNotification(id)
      if (!note) return
      if (document.hidden && alertsState() === 'on') {
        const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined)
        const options = { body: note.body || undefined, icon: '/icons/icon-192.png', badge: '/icons/icon-96.png', tag: note.id, data: { link: note.link } }
        if (registration) void registration.showNotification(note.title, options)
        else new Notification(note.title, options)
      } else {
        setToast(note)
      }
    })
    const onFocus = () => refreshUnread()
    window.addEventListener('focus', onFocus)
    return () => { void supabase.removeChannel(channel); window.removeEventListener('focus', onFocus) }
  }, [user, refreshUnread])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const enableAlerts = useCallback(async () => {
    if (!('Notification' in window)) return
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    try { window.localStorage.setItem(ALERTS_KEY, permission === 'granted' ? 'on' : 'off') } catch { /* storage unavailable */ }
    setAlerts(alertsState())
    // Sign this device up for push so alerts arrive even when the app is closed.
    if (permission === 'granted' && user) await subscribeDevice(user.id).catch(() => undefined)
  }, [user])

  const disableAlerts = useCallback(() => {
    try { window.localStorage.setItem(ALERTS_KEY, 'off') } catch { /* storage unavailable */ }
    setAlerts(alertsState())
    void unsubscribeDevice()
  }, [])

  // Keep this device's push sign-up current (keys can rotate) while alerts are on.
  useEffect(() => {
    if (user && alertsState() === 'on') void subscribeDevice(user.id).catch(() => undefined)
  }, [user])

  return (
    <NotificationsContext.Provider value={{ unread, refreshUnread, alerts, enableAlerts, disableAlerts }}>
      {children}
      {toast && createPortal(
        <button
          type="button"
          onClick={() => { void markRead([toast.id]).then(refreshUnread); setToast(null); if (toast.link) navigate(toast.link) }}
          className="note-toast fixed left-1/2 top-[4.25rem] z-[75] flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 rounded-[22px] border border-white/[0.1] bg-surface-raised p-3 pr-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        >
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#ff5c8a] to-[#e11d5c]">
            {toast.actor?.avatar_url ? <img src={toast.actor.avatar_url} alt="" className="h-full w-full object-cover" /> : <img src="/icons/icon-96.png" alt="" className="h-full w-full" />}
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[13px] font-semibold">{toast.title}</b>
            {toast.body && <span className="block truncate text-xs text-muted-foreground">{toast.body}</span>}
          </span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        </button>,
        document.body,
      )}
    </NotificationsContext.Provider>
  )
}
