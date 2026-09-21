import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'
import { createSessionToken, verifySessionToken, checkAdminPassword } from '../src/lib/auth'
import { validateImage, MAX_IMAGE_BYTES } from '../src/lib/upload-policy'
import { normalizeAvatar, ProfileValidationError } from '../src/lib/profile'

test('session signatures reject tampering, expiry, extra segments and missing secrets', async () => {
  process.env.JWT_SECRET = 'test-only-random-secret-with-at-least-32-characters'
  const token = await createSessionToken()
  assert.equal(await verifySessionToken(token), true)
  assert.equal(await verifySessionToken(`${token}.extra`), false)
  assert.equal(await verifySessionToken(`changed.${token.split('.')[1]}`), false)
  const expired = Buffer.from(JSON.stringify({ role: 'admin', exp: 1 })).toString('base64url')
  const signature = createHmac('sha256', process.env.JWT_SECRET).update(expired).digest('base64url')
  assert.equal(await verifySessionToken(`${expired}.${signature}`), false)
  delete process.env.JWT_SECRET
  assert.equal(await verifySessionToken(token), false)
  await assert.rejects(createSessionToken())
})

test('production rejects default credentials and accepts configured credentials', async () => {
  const original = process.env.NODE_ENV
  Object.assign(process.env, { NODE_ENV: 'production', ADMIN_PASSWORD: 'admin123' })
  await assert.rejects(checkAdminPassword('admin123'))
  process.env.ADMIN_PASSWORD = 'unique-test-password-123'
  assert.equal(await checkAdminPassword('wrong'), false)
  assert.equal(await checkAdminPassword('unique-test-password-123'), true)
  process.env.JWT_SECRET = 'web-coding-platform-super-secret-key-2026'
  await assert.rejects(createSessionToken())
  if (original === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
  else Object.assign(process.env, { NODE_ENV: original })
})

test('uploads reject executable SVGs, unknown types, empty and oversized files', () => {
  for (const type of ['image/svg+xml', 'text/html', 'application/octet-stream']) {
    assert.ok(validateImage({ type, size: 100 }))
  }
  assert.ok(validateImage({ type: 'image/png', size: 0 }))
  assert.ok(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }))
  assert.equal(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES }), null)
})

test('profile rejects browser-local avatar URLs', () => {
  assert.equal(normalizeAvatar(undefined), undefined)
  assert.equal(normalizeAvatar(''), null)
  assert.equal(normalizeAvatar('/api/uploads/avatar.png'), '/api/uploads/avatar.png')
  assert.equal(normalizeAvatar('https://example.com/avatar.png'), 'https://example.com/avatar.png')
  assert.throws(
    () => normalizeAvatar('blob:https://example.com/browser-session-id'),
    ProfileValidationError,
  )
})

test('SQLite and PostgreSQL models remain identical', () => {
  const models = (file: string) => readFileSync(file, 'utf8').split('model Profile')[1]
    .replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '')
  assert.equal(models('prisma/schema.prisma'), models('prisma/postgresql/schema.prisma'))
})
