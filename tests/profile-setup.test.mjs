import assert from 'node:assert/strict'
import test from 'node:test'
import { afterSignIn, dismissProfileSetupLocally, safeAppDestination } from '../src/lib/profileSetup.ts'

const user = (id, profile_setup) => ({ id, user_metadata: { profile_setup } })

test('routes new accounts into setup and returning accounts to their intended destination', () => {
  assert.equal(afterSignIn(user('new', 'pending')), '/onboarding')
  assert.equal(afterSignIn(user('new', 'pending'), '/profile/edit?from=account'), '/onboarding?next=%2Fprofile%2Fedit%3Ffrom%3Daccount')
  for (const status of [undefined, 'completed', 'skipped']) {
    assert.equal(afterSignIn(user('returning', status), '/guide#reading'), '/guide#reading')
  }
})

test('rejects external destinations and auth redirects that could restart setup', () => {
  for (const next of ['https://example.com', '//example.com', '/\\example.com', '/auth', '/ONBOARDING/?next=/home', '/auth/callback', '/reset-password']) {
    assert.equal(safeAppDestination(next), '/home', next)
  }
})

test('offline skip only dismisses setup for the current account', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const stored = new Map()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) },
  } })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else delete globalThis.window
  })
  dismissProfileSetupLocally('first')
  assert.equal(afterSignIn(user('first', 'pending')), '/home')
  assert.equal(afterSignIn(user('second', 'pending')), '/onboarding')
})
