import { AccessToken } from 'livekit-server-sdk'
import { authenticated } from './_supabase.js'

declare const process: { env: Record<string, string | undefined> }

// Doors open ten minutes before a scheduled prayer wall starts.
const EARLY_MS = 10 * 60_000

/**
 * POST { code } → a LiveKit token for that prayer wall's audio room.
 * Only signed-in members get in, and only inside the wall's time frame.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const url = process.env.LIVEKIT_URL ?? process.env.VITE_LIVEKIT_URL
  if (!apiKey || !apiSecret || !url) {
    return res.status(503).json({ configured: false, error: 'Live prayer isn’t connected yet. Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to the environment.' })
  }

  const auth = await authenticated(req)
  if (!auth) return res.status(401).json({ error: 'Sign in to join a prayer wall.' })

  const code = String(req.body?.code ?? '').trim().toLowerCase()
  if (!/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(code)) return res.status(400).json({ error: 'That prayer wall code isn’t valid.' })

  const { data: wall, error } = await auth.supabase.from('prayer_walls').select('id, code, title, host_id, starts_at, ends_at').eq('code', code).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!wall) return res.status(404).json({ error: 'We couldn’t find a prayer wall with that code.' })

  const now = Date.now()
  const start = new Date(wall.starts_at).getTime()
  const end = new Date(wall.ends_at).getTime()
  if (now >= end) return res.status(410).json({ error: 'This prayer wall has ended.' })
  if (now < start - EARLY_MS) return res.status(425).json({ error: 'This prayer wall hasn’t opened yet.', starts_at: wall.starts_at })

  const { data: profile } = await auth.supabase.from('profiles').select('full_name, avatar_url').eq('id', auth.user.id).maybeSingle()
  const name = profile?.full_name || auth.user.email?.split('@')[0] || 'Member'

  const token = new AccessToken(apiKey, apiSecret, {
    identity: auth.user.id,
    name,
    metadata: JSON.stringify({ avatar_url: profile?.avatar_url ?? null, host: wall.host_id === auth.user.id }),
    // The pass lasts until the wall closes (LiveKit counts in seconds).
    ttl: Math.max(60, Math.ceil((end - now) / 1000)),
  })
  token.addGrant({ roomJoin: true, room: `prayer-${wall.code}`, canPublish: true, canSubscribe: true, canPublishData: true })

  return res.status(200).json({ token: await token.toJwt(), url, ends_at: wall.ends_at })
}
