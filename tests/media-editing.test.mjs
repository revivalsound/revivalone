import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultMediaEdit, mediaGeometry } from '../src/lib/mediaEditing.ts'

test('original portrait and landscape frames keep every pixel', () => {
  for (const [width, height] of [[900, 1600], [1800, 900], [1000, 1000]]) {
    const frame = mediaGeometry(defaultMediaEdit(width, height))
    assert.equal(frame.aspect, width / height)
    assert.equal(frame.width, '100%')
    assert.equal(frame.height, '100%')
    assert.equal(frame.left, '50%')
    assert.equal(frame.top, '50%')
  }
})

test('rotation swaps the frame but preserves original photo dimensions', () => {
  const frame = mediaGeometry({ ...defaultMediaEdit(900, 1600), rotation: 90 })
  assert.equal(frame.aspect, 1600 / 900)
  assert.equal(parseFloat(frame.width), 900 / 1600 * 100)
  assert.equal(parseFloat(frame.height), 1600 / 900 * 100)
})

test('crop positions cover the entire frame and respect zoom limits', () => {
  const edit = { ...defaultMediaEdit(1600, 900), aspect: 1, x: 1, zoom: 1 }
  const frame = mediaGeometry(edit)
  assert.equal(frame.height, '100%')
  assert.ok(parseFloat(frame.width) > 100)
  assert.ok(parseFloat(frame.left) < 50)
  assert.deepEqual(mediaGeometry({ ...edit, zoom: 99 }), mediaGeometry({ ...edit, zoom: 3 }))
  assert.equal(mediaGeometry({ ...edit, x: -1 }).left, `${100 - parseFloat(frame.left)}%`)
})
