import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readBilibiliVideoLink, videoWorkUrl } from '../src/lib/video-works'

test('video cards support full links, mobile links, share links and preserve the selected part', () => {
  assert.equal(readBilibiliVideoLink('http://www.bilibili.com/video/BV1t7HN6QErA/?p=2'), 'https://www.bilibili.com/video/BV1t7HN6QErA/?p=2')
  assert.equal(readBilibiliVideoLink('https://m.bilibili.com/video/av123/'), 'https://m.bilibili.com/video/av123/')
  assert.equal(readBilibiliVideoLink(' https://b23.tv/abc123 '), 'https://b23.tv/abc123')
})

test('video collection excludes unrelated links and spoofed Bilibili domains', () => {
  for (const input of ['javascript:alert(1)', 'https://bilibili.com.evil.example/video/BV123', 'https://user:pass@b23.tv/abc', 'https://b23.tv/', 'https://www.bilibili.com/', 'https://example.com/video/BV123', null]) {
    assert.equal(readBilibiliVideoLink(input), null)
  }
})

test('collection prefers a Bilibili demo, falls back to the main URL and excludes other projects', () => {
  const link = 'https://www.bilibili.com/video/BV1t7HN6QErA/'
  assert.equal(videoWorkUrl({ url: 'https://example.com', videoUrl: link }), link)
  assert.equal(videoWorkUrl({ url: link, videoUrl: 'https://example.com/demo' }), link)
  assert.equal(videoWorkUrl({ url: 'https://example.com' }), null)
})
