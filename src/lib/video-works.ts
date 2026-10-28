import { readBilibiliVideoEmbed } from './bilibili-video'

/** Only link to video pages or Bilibili's official share links. */
export function readBilibiliVideoLink(value?: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    url.protocol = 'https:'
    if (url.hostname === 'b23.tv' && /^\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) return url.href
    return readBilibiliVideoEmbed(url.href)?.sourceUrl ?? null
  } catch { return null }
}

export function videoWorkUrl(project: { videoUrl?: string | null; url: string }): string | null {
  return readBilibiliVideoLink(project.videoUrl) || readBilibiliVideoLink(project.url)
}

export type VideoWork = {
  id: string
  title: string
  summary: string
  cover: string | null
  href: string
  category: string
  tags: string[]
  featured: boolean
  completedAt: string | null
}
