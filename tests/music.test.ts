import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_AUDIO_BYTES,
  MAX_MUSIC_TRACKS,
  MusicValidationError,
  normalizeAudioUrl,
  normalizeMusicSettings,
  settingsFromRecord,
  validateAudioFile,
} from '../src/lib/music'

const track = {
  id: 'track-1',
  title: 'Night Coding',
  artist: 'WebCoding Studio',
  url: 'https://cdn.example.com/music/night.mp3',
}

test('music settings normalize a safe playlist and repair a missing default track', () => {
  const settings = normalizeMusicSettings({
    enabled: true,
    autoplay: false,
    loopPlaylist: true,
    defaultVolume: 35,
    defaultTrackId: 'missing',
    tracks: [track],
  })

  assert.equal(settings.defaultTrackId, track.id)
  assert.equal(settings.tracks[0].url, track.url)
  assert.equal(normalizeAudioUrl('/api/music/files/example.mp3'), '/api/music/files/example.mp3')
})

test('music settings reject unsafe URLs, duplicate IDs and invalid enabled playlists', () => {
  for (const url of ['javascript:alert(1)', 'data:audio/mp3;base64,a', '//example.com/a.mp3', 'https://user:pass@example.com/a.mp3', '/api/uploads/not-audio.png']) {
    assert.throws(() => normalizeAudioUrl(url), MusicValidationError)
  }

  const base = {
    enabled: true,
    autoplay: false,
    loopPlaylist: true,
    defaultVolume: 35,
    defaultTrackId: track.id,
  }
  assert.throws(() => normalizeMusicSettings({ ...base, tracks: [] }), /先添加歌曲/)
  assert.throws(() => normalizeMusicSettings({ ...base, tracks: [track, track] }), /重复/)
  assert.throws(() => normalizeMusicSettings({ ...base, defaultVolume: 101, tracks: [track] }), /0 到 100/)
  assert.throws(() => normalizeMusicSettings({ ...base, tracks: Array(MAX_MUSIC_TRACKS + 1).fill(track) }), /最多/)
})

test('corrupt stored music settings fail closed and audio uploads enforce type and size', () => {
  assert.deepEqual(settingsFromRecord({
    enabled: true,
    autoplay: true,
    loopPlaylist: true,
    defaultVolume: 35,
    defaultTrackId: null,
    tracks: 'not-json',
  }).tracks, [])

  assert.equal(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES }), null)
  assert.ok(validateAudioFile({ type: 'audio/mpeg', size: 0 }))
  assert.ok(validateAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES + 1 }))
  assert.ok(validateAudioFile({ type: 'text/html', size: 100 }))
})
