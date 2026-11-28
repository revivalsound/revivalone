// In-memory test service. Never contacts the real project or writes real posts.
const id = '00000000-0000-4000-8000-000000000001'
const user = { id, email: 'fixture@example.test', user_metadata: { full_name: 'REST Test Member' } }
const author = { id, full_name: 'REST Test Member', city: 'Lagos', avatar_url: null }
export const fixturePost = { id, author_id: id, kind: 'word' as const, opportunity_type: null, title: 'A moment of encouragement', body: 'A thoughtful word for the community.', body_html: '', tags: ['faith'], scripture: 'John 3:16', link_url: '', author, created_at: new Date().toISOString(), media: [] as unknown[] }
let liked = false
const comments: any[] = []
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  rpc: async () => ({ data: [{ post_id: id, likes: liked ? 5 : 4, comments: comments.length, liked }], error: null }),
  storage: { from: () => ({ upload: async (path: string, file: File) => { blobs.set(path, URL.createObjectURL(file)); return { error: null } }, getPublicUrl: (path: string) => ({ data: { publicUrl: blobs.get(path) } }) }) },
  from(table: string) {
    let op = 'select', input: any, selectedId: string | undefined
    const query: any = {
      select() { return query }, limit() { return query }, order() { return query }, range() { return query }, neq() { return query }, overlaps() { return query },
      eq(key: string, value: string) { if (key === 'id') selectedId = value; return query },
      insert(value: any) { op = 'insert'; input = value; return query },
      upsert() { liked = true; return query }, delete() { op = 'delete'; return query },
      async single() { return result(true) }, async maybeSingle() { return result(true) },
      then(resolve: any) { return Promise.resolve(result(false)).then(resolve) },
    }
    function result(single: boolean) {
      if (table === 'profiles') return { data: single ? author : [author], error: null }
      if (table === 'posts') {
        if (op === 'insert') Object.assign(fixturePost, input)
        return { data: single ? fixturePost : [fixturePost], error: null }
      }
      if (table === 'post_likes' && op === 'delete') liked = false
      if (table === 'post_comments') {
        if (op === 'insert') { const comment = { ...input, id: crypto.randomUUID(), author_id: id, author, created_at: new Date().toISOString() }; comments.unshift(comment); return { data: comment, error: null } }
        if (op === 'delete') comments.splice(comments.findIndex(item => item.id === selectedId), 1)
        return { data: [...comments], error: null }
      }
      return { data: [], error: null }
    }
    return query
  },
}
const blobs = new Map<string, string>()
export const supabaseUrl = 'http://localhost:5194'
