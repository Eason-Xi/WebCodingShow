import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildXIntent, isMomentMediaUrl, MAX_MOMENT_IMAGE_BYTES, MAX_MOMENT_VIDEO_BYTES, MomentValidationError, momentShareTitle, normalizeMomentInput, normalizeMomentMedia, normalizeSocialUrl, validateMomentFile } from '../src/lib/moments'
import { parseMediaRange } from '../src/lib/media-range'

const image = { url: '/api/moments/media/12345678-1234-1234-1234-123456789012.png', type: 'image/png', size: 50, name: '剪贴板图片.png' }
const video = { ...image, url: image.url.replace('.png', '.mp4'), type: 'video/mp4', name: '视频.mp4' }

test('moment attachments enforce per-type limits and reject unsafe URLs and mismatched types', () => {
  assert.equal(validateMomentFile({ type: 'image/png', size: MAX_MOMENT_IMAGE_BYTES }), null)
  assert.ok(validateMomentFile({ type: 'image/png', size: MAX_MOMENT_IMAGE_BYTES + 1 }))
  assert.equal(validateMomentFile({ type: 'video/mp4', size: MAX_MOMENT_VIDEO_BYTES }), null)
  for (const size of [0, -1, NaN, Infinity, 0.5, MAX_MOMENT_VIDEO_BYTES + 1]) assert.ok(validateMomentFile({ type: 'video/mp4', size }))
  for (const type of ['image/svg+xml', 'text/html', 'application/octet-stream']) assert.ok(validateMomentFile({ type, size: 50 }))
  for (const url of ['javascript:alert(1)', 'data:image/png;base64,x', 'blob:https://example.com/x', '//evil.test/file.png', '/api/moments/media/../../secret.png', 'https://evil.test/video.mp4', 'https://store.public.blob.vercel-storage.com.evil.test/moments/123.png']) assert.equal(isMomentMediaUrl(url), false)
  assert.equal(isMomentMediaUrl('https://store.public.blob.vercel-storage.com/moments/12345678-1234-1234-1234-123456789012.png'), true)
  assert.throws(() => normalizeMomentMedia([{ ...image, type: 'video/mp4' }]), MomentValidationError)
  assert.throws(() => normalizeMomentMedia([image, image]), MomentValidationError)
  assert.throws(() => normalizeMomentMedia([image, video]), MomentValidationError)
  assert.deepEqual(normalizeMomentMedia([video]), [video])
})

test('moment validation permits media-only posts and preserves Unicode while rejecting blank and oversized posts', () => {
  assert.throws(() => normalizeMomentInput({ content: ' \n ', status: 'draft', media: [] }), MomentValidationError)
  assert.throws(() => normalizeMomentInput({ content: 'hello', status: 'public' }), MomentValidationError)
  assert.throws(() => normalizeMomentInput({ content: 'hello', status: 'published', pinned: 'false' }), MomentValidationError)
  assert.equal(normalizeMomentInput({ content: ' 💡 '.repeat(1000), status: 'published' }).content.length > 3000, true)
  assert.throws(() => normalizeMomentInput({ content: '中'.repeat(3001), status: 'published' }), MomentValidationError)
  assert.deepEqual(JSON.parse(normalizeMomentInput({ content: '', media: [video], status: 'published' }).media), [video])
})

test('social links require real post paths on the selected platform and preserve signed XHS queries', () => {
  assert.equal(normalizeSocialUrl('https://x.com/eason/status/123', 'x'), 'https://x.com/eason/status/123')
  const note = 'https://www.xiaohongshu.com/explore/note123?xsec_token=abc%2Bdef'
  assert.equal(normalizeSocialUrl(note, 'xhs'), note)
  assert.equal(normalizeSocialUrl('', 'x'), null)
  for (const url of ['https://x.com/', 'http://x.com/user/status/1', 'https://x.com.evil.test/user/status/1', 'https://x.com@evil.test/user/status/1', 'https://x.com:8443/user/status/1']) assert.throws(() => normalizeSocialUrl(url, 'x'), MomentValidationError)
  assert.throws(() => normalizeSocialUrl('https://x.com/a/status/1', 'xhs'), MomentValidationError)
  assert.equal(normalizeSocialUrl('https://xhslink.com/a/abc123', 'xhs'), 'https://xhslink.com/a/abc123')
})

test('X handoff safely encodes text and permalink without pretending to upload media', () => {
  const text = '今天的进展 & 灵感 #开发\nhttps://example.com?a=1&b=2 💡'
  const url = new URL(buildXIntent(text, 'https://portfolio.example/moments/123'))
  assert.equal(url.origin, 'https://x.com')
  assert.equal(url.searchParams.get('text'), text)
  assert.equal(url.searchParams.get('url'), 'https://portfolio.example/moments/123')
  assert.equal(momentShareTitle(' \n一个标题\n正文'), '一个标题')
  assert.equal(Array.from(momentShareTitle('💡'.repeat(25))).length, 20)
})

test('video ranges support seeking, open-ended and suffix requests and reject invalid ranges', () => {
  assert.equal(parseMediaRange(null, 100), null)
  assert.deepEqual(parseMediaRange('bytes=20-39', 100), { start: 20, end: 39 })
  assert.deepEqual(parseMediaRange('bytes=20-', 100), { start: 20, end: 99 })
  assert.deepEqual(parseMediaRange('bytes=-10', 100), { start: 90, end: 99 })
  assert.deepEqual(parseMediaRange('bytes=0-999', 100), { start: 0, end: 99 })
  assert.deepEqual(parseMediaRange('bytes=-1000', 100), { start: 0, end: 99 })
  for (const value of ['bytes=-0', 'bytes=100-', 'bytes=30-20', 'bytes=0-1,5-6', 'bytes=-', 'not-a-range']) assert.equal(parseMediaRange(value, 100), 'invalid')
})
