import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function loadPosts(responses) {
  const calls = []
  const stub = {
    from(table) {
      return { select(columns) {
        return { async limit() {
          calls.push({ table, columns })
          const response = responses.shift()
          if (!response) throw new Error('Unexpected schema check')
          return response
        } }
      } }
    },
  }
  const source = (await readFile(new URL('../src/lib/posts.ts', import.meta.url), 'utf8'))
    .replace("import { supabase } from './supabase'", 'const supabase = globalThis.__postMediaTestClient')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
  globalThis.__postMediaTestClient = stub
  try {
    const module = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}#${Math.random()}`)
    return { module, calls }
  } finally {
    delete globalThis.__postMediaTestClient
  }
}

const ok = { error: null }
const missing = code => ({ error: { code, message: 'Column not found' } })

test('media check recovers after migration without refreshing the app', async () => {
  for (const code of ['42703', 'PGRST204']) {
    const { module, calls } = await loadPosts([missing(code), missing(code), ok, ok])
    await assert.rejects(module.ensurePostMediaReady(), /temporarily unavailable/)
    assert.equal(module.richPosts, false)
    await module.ensurePostMediaReady()
    assert.equal(module.richPosts, true)
    assert.equal(module.mentionsReady, true)
    await module.ensurePostMediaReady()
    assert.equal(calls.length, 4, 'successful checks should be shared')
  }
})

test('transient errors do not permanently poison the schema check', async () => {
  const { module } = await loadPosts([{ error: { message: 'Network unavailable' } }, ok, ok, ok])
  await assert.rejects(module.ensurePostMediaReady(), /Network unavailable/)
  await module.ensurePostMediaReady()
  assert.equal(module.richPosts, true)
})

test('missing media support blocks publication before inserting a post', async () => {
  const { module } = await loadPosts([missing('42703'), ok])
  await assert.rejects(module.createPost({ media: [{ url: 'test.jpg', type: 'image' }] }), /temporarily unavailable/)
})
