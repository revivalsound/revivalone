import { createClient } from '@supabase/supabase-js'
import * as webpushModule from 'web-push'

// web-push is CommonJS; this works under both Vite's dev server and Vercel.
const webpush = ((webpushModule as unknown as { default?: typeof webpushModule }).default ?? webpushModule) as typeof webpushModule

declare const process: { env: Record<string, string | undefined> }

/**
 * POST from the database (supabase/push.sql) for each new notification:
 * sends it to every device the member signed up for push, and forgets
 * devices that have unsubscribed.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const secret = process.env.PUSH_WEBHOOK_SECRET
  if (!secret || req.headers['x-push-secret'] !== secret) return res.status(401).json({ error: 'Not allowed.' })

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'https://yvahpzbkxpgjufnxrisc.supabase.co'
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ configured: false, error: 'Push needs VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and SUPABASE_SERVICE_ROLE_KEY.' })
  }

  const note = (req.body ?? {}) as { id?: string; user_id?: string; title?: string; body?: string; link?: string; type?: string }
  if (!note.user_id || !note.title) return res.status(400).json({ error: 'Missing notification.' })

  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'https://revivalone.vercel.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  const admin = createClient(url, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: devices, error } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', note.user_id)
  if (error) return res.status(500).json({ error: error.message })

  const payload = JSON.stringify({ id: note.id, title: note.title, body: note.body ?? '', link: note.link || '/notifications', type: note.type })
  const gone: string[] = []
  let sent = 0
  await Promise.all((devices ?? []).map(async device => {
    try {
      await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } }, payload, { TTL: 60 * 60 * 24, urgency: 'normal' })
      sent += 1
    } catch (caught: any) {
      if (caught?.statusCode === 404 || caught?.statusCode === 410) gone.push(device.id)
    }
  }))
  if (gone.length) await admin.from('push_subscriptions').delete().in('id', gone)

  return res.status(200).json({ sent, removed: gone.length })
}
