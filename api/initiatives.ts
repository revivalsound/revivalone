import { authenticated } from './_supabase.js'

const allowedKinds = new Set(['event', 'bootcamp', 'cell'])

export default async function handler(req: any, res: any) {
  const auth = await authenticated(req)
  if (!auth) return res.status(401).json({ error: 'Sign in to continue. Your session may have expired.' })

  if (req.method === 'GET') {
    const { data, error } = await auth.supabase.from('initiatives').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ initiatives: data })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const body = (req.body ?? {}) as { kind?: string; title?: string; city?: string; startsAt?: string; description?: string }
  const kind = String(body.kind ?? '').trim().toLowerCase()
  const title = String(body.title ?? '').trim()
  const city = String(body.city ?? '').trim()
  const description = String(body.description ?? '').trim()
  if (!allowedKinds.has(kind) || title.length < 3 || city.length < 2 || description.length < 10 || !body.startsAt) {
    return res.status(400).json({ error: 'Complete every field with a little more detail.' })
  }

  const { data, error } = await auth.supabase.from('initiatives').insert({
    owner_id: auth.user.id, kind, title, city, starts_at: body.startsAt, description, status: 'draft',
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({ initiative: data })
}
