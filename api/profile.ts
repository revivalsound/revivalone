import { authenticated } from './_supabase.js'

export default async function handler(req: any, res: any) {
  const auth = await authenticated(req)
  if (!auth) return res.status(401).json({ error: 'Sign in to view your profile.' })

  if (req.method === 'GET') {
    const { data: profile, error } = await auth.supabase.from('profiles')
      .select('id, full_name, city, country, church, ministry_focus, bio, avatar_url, created_at, updated_at')
      .eq('id', auth.user.id).single()
    if (error) return res.status(500).json({ error: error.message })

    const [initiatives, events, cells, courses] = await Promise.all([
      auth.supabase.from('initiatives').select('id', { count: 'exact', head: true }).eq('owner_id', auth.user.id),
      auth.supabase.from('event_registrations').select('event_id', { count: 'exact', head: true }).eq('user_id', auth.user.id),
      auth.supabase.from('community_memberships').select('cell_id', { count: 'exact', head: true }).eq('user_id', auth.user.id),
      auth.supabase.from('course_enrollments').select('course_id', { count: 'exact', head: true }).eq('user_id', auth.user.id),
    ])

    return res.status(200).json({
      profile: { ...profile, email: auth.user.email ?? '' },
      stats: { initiatives: initiatives.count ?? 0, events: events.count ?? 0, cells: cells.count ?? 0, courses: courses.count ?? 0 },
    })
  }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed.' })

  const body = (req.body ?? {}) as Record<string, unknown>
  const text = (key: string, max: number) => String(body[key] ?? '').trim().slice(0, max)
  const fullName = text('full_name', 100)
  if (fullName.length < 2) return res.status(400).json({ error: 'Enter your full name.' })

  const updates = {
    full_name: fullName,
    city: text('city', 80),
    country: text('country', 80),
    church: text('church', 120),
    ministry_focus: text('ministry_focus', 120),
    bio: text('bio', 500),
    avatar_url: text('avatar_url', 600) || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await auth.supabase.from('profiles').update(updates).eq('id', auth.user.id).select().single()
  if (error) return res.status(500).json({ error: error.message })

  // Keep the session's metadata in step so the shell's name and avatar update.
  if (auth.user.user_metadata?.full_name !== fullName || auth.user.user_metadata?.avatar_url !== updates.avatar_url) {
    await auth.supabase.auth.updateUser({ data: { ...auth.user.user_metadata, full_name: fullName, city: updates.city, avatar_url: updates.avatar_url } })
  }

  return res.status(200).json({ profile: data })
}
