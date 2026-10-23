export const MAX_MUSIC_TRACKS = 30
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
}

export type MusicTrack = {
  id: string
  title: string
  artist: string
  url: string
}

export type MusicSettingsPayload = {
  enabled: boolean
  autoplay: boolean
  loopPlaylist: boolean
  defaultVolume: number
  defaultTrackId: string | null
  tracks: MusicTrack[]
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettingsPayload = {
  enabled: false,
  autoplay: false,
  loopPlaylist: true,
  defaultVolume: 35,
  defaultTrackId: null,
  tracks: [],
}

export class MusicValidationError extends Error {}

type StoredMusicSettings = {
  enabled: boolean
  autoplay: boolean
  loopPlaylist: boolean
  defaultVolume: number
  defaultTrackId: string | null
  tracks: string
}

function cleanText(value: unknown, label: string, maxLength: number, required = false): string {
  if (typeof value !== 'string') {
    if (!required && value == null) return ''
    throw new MusicValidationError(`${label}格式不正确`)
  }
  const text = value.trim()
  if (required && !text) throw new MusicValidationError(`请填写${label}`)
  if (text.length > maxLength) throw new MusicValidationError(`${label}不能超过 ${maxLength} 个字符`)
  return text
}

export function normalizeAudioUrl(value: unknown): string {
  const url = cleanText(value, '歌曲地址', 2048, true)
  if (/^\/api\/music\/files\/[a-zA-Z0-9._-]+$/.test(url)) return url

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error('unsupported URL')
    }
    return parsed.toString()
  } catch {
    throw new MusicValidationError('歌曲地址必须是完整的 http/https 地址或本站上传地址')
  }
}

export function normalizeMusicTrack(value: unknown): MusicTrack {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MusicValidationError('歌曲信息格式不正确')
  }
  const track = value as Record<string, unknown>
  const id = cleanText(track.id, '歌曲 ID', 100, true)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new MusicValidationError('歌曲 ID 格式不正确')

  return {
    id,
    title: cleanText(track.title, '歌曲名称', 100, true),
    artist: cleanText(track.artist, '歌手名称', 100),
    url: normalizeAudioUrl(track.url),
  }
}

export function normalizeMusicSettings(value: unknown): MusicSettingsPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MusicValidationError('音乐设置格式不正确')
  }
  const input = value as Record<string, unknown>
  const enabled = input.enabled
  const autoplay = input.autoplay
  const loopPlaylist = input.loopPlaylist
  if (typeof enabled !== 'boolean' || typeof autoplay !== 'boolean' || typeof loopPlaylist !== 'boolean') {
    throw new MusicValidationError('音乐开关格式不正确')
  }
  if (!Number.isInteger(input.defaultVolume) || Number(input.defaultVolume) < 0 || Number(input.defaultVolume) > 100) {
    throw new MusicValidationError('默认音量必须是 0 到 100 的整数')
  }
  if (!Array.isArray(input.tracks) || input.tracks.length > MAX_MUSIC_TRACKS) {
    throw new MusicValidationError(`歌单最多可保存 ${MAX_MUSIC_TRACKS} 首歌曲`)
  }

  const tracks = input.tracks.map(normalizeMusicTrack)
  const ids = new Set(tracks.map((track) => track.id))
  if (ids.size !== tracks.length) throw new MusicValidationError('歌单中存在重复的歌曲 ID')
  if (input.enabled && tracks.length === 0) throw new MusicValidationError('启用背景音乐前请先添加歌曲')

  const requestedDefault = input.defaultTrackId == null
    ? null
    : cleanText(input.defaultTrackId, '默认歌曲 ID', 100)

  return {
    enabled,
    autoplay,
    loopPlaylist,
    defaultVolume: Number(input.defaultVolume),
    defaultTrackId: requestedDefault && ids.has(requestedDefault)
      ? requestedDefault
      : tracks[0]?.id ?? null,
    tracks,
  }
}

export function settingsFromRecord(record: StoredMusicSettings | null): MusicSettingsPayload {
  if (!record) return DEFAULT_MUSIC_SETTINGS
  try {
    return normalizeMusicSettings({
      enabled: record.enabled,
      autoplay: record.autoplay,
      loopPlaylist: record.loopPlaylist,
      defaultVolume: record.defaultVolume,
      defaultTrackId: record.defaultTrackId,
      tracks: JSON.parse(record.tracks),
    })
  } catch {
    return DEFAULT_MUSIC_SETTINGS
  }
}

export function validateAudioFile(file: { type: string; size: number }): string | null {
  return !AUDIO_EXTENSIONS[file.type] || file.size === 0 || file.size > MAX_AUDIO_BYTES
    ? '请上传 25 MB 以内的 MP3、M4A、WAV 或 OGG 音频'
    : null
}
