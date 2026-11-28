import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function loadEngagement(stub) {
  const source = (await readFile(new URL('../src/lib/postEngagement.ts', import.meta.url), 'utf8'))
    .replace("import { supabase } from './supabase'", 'const supabase = globalThis.__engagementTestClient')
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
  globalThis.__engagementTestClient = stub
  try { return await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}#${Math.random()}`) }
  finally { delete globalThis.__engagementTestClient }
}

test('feed cards batch engagement into one request with unique IDs', async () => {
  const calls = []
  const module = await loadEngagement({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ post_id: 'first', likes: '12', comments: '3', liked: true }], error: null }
  } })
  const results = await Promise.all([module.fetchEngagement('first'), module.fetchEngagement('second'), module.fetchEngagement('first')])
  assert.deepEqual(calls, [{ name: 'post_engagement', args: { post_ids: ['first', 'second'] } }])
  assert.deepEqual(results[0], { likes: 12, comments: 3, liked: true })
  assert.deepEqual(results[1], { likes: 0, comments: 0, liked: false })
  assert.deepEqual(results[2], results[0])
})

test('missing backend returns an actionable error and the next request can recover', async () => {
  let ready = false
  const module = await loadEngagement({ rpc: async () => ready ? { data: [], error: null } : { data: null, error: { code: 'PGRST202', message: 'Missing function' } } })
  await assert.rejects(module.fetchEngagement('first'), /temporarily unavailable/)
  ready = true
  assert.deepEqual(await module.fetchEngagement('first'), { likes: 0, comments: 0, liked: false })
})

test('empty and oversized comments never reach the database', async () => {
  const module = await loadEngagement({ from() { assert.fail('Invalid comment must not be sent') } })
  for (const body of ['  ', 'a'.repeat(3001)]) await assert.rejects(module.addComment('first', body), /3,000/)
})
