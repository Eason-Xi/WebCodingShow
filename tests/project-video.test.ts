import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProjectVideoUrl, readProjectVideoUrl } from '../src/lib/project-video'

test('video sharing links retain video IDs, query parameters and timestamps', () => {
  for (const url of [
    'https://www.bilibili.com/video/BV1xx411c7mD/?p=2&t=60',
    'https://www.youtube.com/watch?v=demo123&t=42s',
    'https://youtu.be/demo123?si=share#t=15',
    'https://vimeo.com/123456789',
    'https://video.example.com/watch/123',
  ]) assert.equal(normalizeProjectVideoUrl(` ${url} `), url)
  for (const value of [undefined, null, '', '   ']) assert.equal(normalizeProjectVideoUrl(value), null)
})

test('video links reject executable schemes, credentials, invalid types and oversized input', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '//youtube.com/watch', 'ftp://example.com/video', 'https://user:pass@example.com/video', 'https://', 'https://example.com/a b', 'https://example.com/' + 'a'.repeat(2048), 42, {}, []]) {
    assert.throws(() => normalizeProjectVideoUrl(value))
  }
  assert.equal(readProjectVideoUrl('javascript:alert(1)'), null)
  assert.equal(readProjectVideoUrl(null), null)
})
