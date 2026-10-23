export type BilibiliVideoEmbed = {
  sourceUrl: string
  playerUrl: string
  videoId: string
  page: number
}

const BILIBILI_VIDEO_HOSTS = new Set([
  'bilibili.com',
  'www.bilibili.com',
  'm.bilibili.com',
])

function readPositiveInteger(value: string | null, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function readBilibiliVideoEmbed(value?: string | null): BilibiliVideoEmbed | null {
  if (!value) return null

  try {
    const source = new URL(value)
    if (source.protocol !== 'https:' || source.username || source.password || !BILIBILI_VIDEO_HOSTS.has(source.hostname.toLowerCase())) {
      return null
    }

    const match = source.pathname.match(/^\/video\/(BV[0-9A-Za-z]+|av\d+)\/?$/i)
    if (!match) return null

    const videoId = match[1]
    const page = readPositiveInteger(source.searchParams.get('p'), 1)
    const player = new URL('https://player.bilibili.com/player.html')
    player.searchParams.set('isOutside', 'true')
    if (/^BV/i.test(videoId)) player.searchParams.set('bvid', videoId)
    else player.searchParams.set('aid', videoId.slice(2))
    player.searchParams.set('page', String(page))
    player.searchParams.set('high_quality', '1')
    player.searchParams.set('danmaku', '0')
    player.searchParams.set('autoplay', '0')

    return {
      sourceUrl: source.href,
      playerUrl: player.href,
      videoId,
      page,
    }
  } catch {
    return null
  }
}
