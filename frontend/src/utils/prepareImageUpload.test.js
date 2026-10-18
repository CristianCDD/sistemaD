import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prepareImageUpload } from './prepareImageUpload.js'

test('small files and animated formats are preserved', async () => {
  for (const file of [new File(['small'], 'small.png', { type: 'image/png' }),
    new File([new Uint8Array(500000)], 'animated.gif', { type: 'image/gif' })]) {
    assert.equal(await prepareImageUpload(file), file)
  }
})

test('large photos are bounded and smaller WebP files replace originals', async t => {
  const canvas = { getContext: () => ({ drawImage() {} }),
    toBlob: callback => callback(new Blob(['compressed'], { type: 'image/webp' })) }
  let closed = false
  const previousDocument = globalThis.document
  const previousDecoder = globalThis.createImageBitmap
  globalThis.document = { createElement: () => canvas }
  globalThis.createImageBitmap = async () => ({ width: 4000, height: 3000, close() { closed = true } })
  t.after(() => { globalThis.document = previousDocument; globalThis.createImageBitmap = previousDecoder })
  const original = new File([new Uint8Array(500000)], 'photo.png', { type: 'image/png', lastModified: 123 })
  const prepared = await prepareImageUpload(original)
  assert.deepEqual([canvas.width, canvas.height], [2048, 1536])
  assert.equal(prepared.name, 'photo.webp')
  assert.equal(prepared.type, 'image/webp')
  assert.equal(prepared.lastModified, 123)
  assert.ok(prepared.size < original.size)
  assert.equal(closed, true)
})

test('larger encodings and unsupported output keep the original', async t => {
  const original = new File([new Uint8Array(500000)], 'photo.jpg', { type: 'image/jpeg' })
  const previousDocument = globalThis.document
  const previousDecoder = globalThis.createImageBitmap
  globalThis.createImageBitmap = async () => ({ width: 1000, height: 1000, close() {} })
  t.after(() => { globalThis.document = previousDocument; globalThis.createImageBitmap = previousDecoder })
  for (const blob of [new Blob([new Uint8Array(600000)], { type: 'image/webp' }),
    new Blob(['unsupported'], { type: 'image/png' }), null]) {
    globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: callback => callback(blob) }) }
    assert.equal(await prepareImageUpload(original), original)
  }
})

test('decode failures do not block image uploads', async t => {
  const previousDecoder = globalThis.createImageBitmap
  globalThis.createImageBitmap = async () => { throw new Error('Unsupported decoder') }
  t.after(() => { globalThis.createImageBitmap = previousDecoder })
  const original = new File([new Uint8Array(500000)], 'photo.png', { type: 'image/png' })
  assert.equal(await prepareImageUpload(original), original)
})
