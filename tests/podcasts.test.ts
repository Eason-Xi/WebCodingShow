import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePodcastRss, parseDuration } from '../src/lib/podcast-rss'
import { podcastAudioSource } from '../src/lib/podcasts'
const feed = (items: string) => `<?xml version="1.0"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>日更 AI</title><description>每日资讯</description>${items}</channel></rss>`
const item = '<item><title>第一期</title><guid isPermaLink="false">001</guid><description><![CDATA[<p>Hello <b>world</b></p><script>alert(1)</script>]]></description><itunes:duration>52</itunes:duration><enclosure url="https://example.com/episode.wav" type="audio/wav" /></item>'
test('RSS parses audio, CDATA and string GUIDs without requiring optional fields', () => {
  const result = parsePodcastRss(feed(item), 'https://example.com/rss.xml')
  assert.equal(result.title, '日更 AI')
  assert.equal(result.cover, null)
  assert.equal(result.episodes[0].guid, '001')
  assert.equal(result.episodes[0].duration, 52)
  assert.equal(result.episodes[0].description, 'Hello world')
  assert.equal(result.episodes[0].publishedAt, null)
})
test('duplicate GUIDs collapse and unsafe enclosures are excluded', () => {
  const result = parsePodcastRss(feed(item + item + item.replace('001', '002').replace('https://example.com/episode.wav', 'http://127.0.0.1/private')), 'https://example.com/rss.xml')
  assert.equal(result.episodes.length, 1)
})
test('duration accepts seconds, minutes and hours, rejects invalid values', () => {
  assert.equal(parseDuration('01:02:03'), 3723)
  assert.equal(parseDuration('02:15'), 135)
  assert.equal(parseDuration(undefined), null)
  assert.equal(parseDuration('bad'), null)
})
test('malformed XML, entities and non-podcast feeds fail without producing records', () => {
  assert.throws(() => parsePodcastRss('<rss>', 'https://example.com'), /XML/)
  assert.throws(() => parsePodcastRss('<!DOCTYPE rss><rss/>', 'https://example.com'), /实体/)
  assert.throws(() => parsePodcastRss(feed('<item><title>文字</title></item>'), 'https://example.com'), /音频/)
})
test('relative media URLs resolve and missing GUID uses enclosure URL', () => {
  const result = parsePodcastRss(feed(item.replace('<guid isPermaLink="false">001</guid>', '').replace('https://example.com/episode.wav', '../audio.wav')), 'https://example.com/feed/rss.xml')
  assert.equal(result.episodes[0].guid, 'https://example.com/audio.wav')
})

test('Muse audio uses a per-episode resolver while other publishers keep direct playback', () => {
  assert.equal(podcastAudioSource({ id: 'ep-1', audioUrl: 'https://muse.ai/podcasts/media/user/feed/episode.mp3' }), '/api/podcasts/episodes/ep-1/audio')
  for (const audioUrl of ['https://example.com/audio.mp3', 'https://muse.ai.example.com/podcasts/media/audio.mp3']) {
    assert.equal(podcastAudioSource({ id: 'ep-1', audioUrl }), audioUrl)
  }
})

test('canonical self URL survives a signed CDN response URL and unsafe self links are ignored', () => {
  const original = 'https://muse.ai/podcasts/feed/user/feed'
  const xml = feed(`<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="self" href="${original}"/>${item}`)
  assert.equal(parsePodcastRss(xml, 'https://cdn.example.com/signed.xml?expires=123').feedUrl, original)
  assert.equal(parsePodcastRss(xml.replace(original, 'http://127.0.0.1/private'), 'https://cdn.example.com/signed.xml').feedUrl, null)
})
