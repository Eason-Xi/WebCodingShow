export const MAX_MOMENT_LENGTH = 3000
export const MAX_MOMENT_IMAGES = 4
export const MAX_MOMENT_IMAGE_BYTES = 4 * 1024 * 1024
export const MAX_MOMENT_VIDEO_BYTES = 100 * 1024 * 1024
export const MOMENT_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
}
export const MOMENT_ACCEPT = Object.keys(MOMENT_MIME_EXTENSIONS).join(',')

export type MomentMedia = { url: string; type: string; name: string; size: number }
export type MomentData = {
  id: string; content: string; media: MomentMedia[]; status: string; pinned: boolean
  xUrl: string | null; xhsUrl: string | null
  createdAt: string; updatedAt: string; publishedAt: string | null
}
export type MomentAuthor = { name: string; avatar: string | null }
export class MomentValidationError extends Error {}

export function validateMomentFile(file: { type: string; size: number }): string | null {
  if (!MOMENT_MIME_EXTENSIONS[file.type]) return '支持 JPG、PNG、WebP、GIF 图片和 MP4、WebM、MOV 视频'
  const video = file.type.startsWith('video/')
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > (video ? MAX_MOMENT_VIDEO_BYTES : MAX_MOMENT_IMAGE_BYTES)) {
    return video ? '视频须大于 0 且不超过 100 MB' : '图片须大于 0 且不超过 4 MB'
  }
  return null
}

export function isMomentMediaUrl(value: string): boolean {
  if (/^\/api\/moments\/media\/[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/.test(value)) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash
      && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname)
      && /^\/moments\/[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/.test(url.pathname)
  } catch { return false }
}

export function normalizeMomentMedia(value: unknown): MomentMedia[] {
  if (!Array.isArray(value) || value.length > MAX_MOMENT_IMAGES) throw new MomentValidationError('每条动态最多 4 张图片或 1 个视频')
  const media = value.map((item): MomentMedia => {
    if (!item || typeof item !== 'object' || typeof item.url !== 'string' || !isMomentMediaUrl(item.url)
      || typeof item.type !== 'string' || typeof item.name !== 'string' || item.name.length > 200
      || validateMomentFile(item)) throw new MomentValidationError('附件格式不正确，请重新上传')
    if (!new URL(item.url, 'https://local.invalid').pathname.endsWith(MOMENT_MIME_EXTENSIONS[item.type])) {
      throw new MomentValidationError('附件类型与文件地址不匹配')
    }
    return { url: item.url, type: item.type, name: item.name, size: item.size }
  })
  if (media.some(item => item.type.startsWith('video/')) && media.length !== 1) throw new MomentValidationError('视频需要单独发布，请选择 1 个视频或最多 4 张图片')
  if (new Set(media.map(item => item.url)).size !== media.length) throw new MomentValidationError('附件不能重复')
  return media
}

export function normalizeMomentInput(value: unknown) {
  if (!value || typeof value !== 'object') throw new MomentValidationError('动态格式不正确')
  const input = value as Record<string, unknown>
  if (typeof input.content !== 'string') throw new MomentValidationError('请输入动态内容')
  const content = input.content.trim()
  if (Array.from(content).length > MAX_MOMENT_LENGTH) throw new MomentValidationError(`动态不能超过 ${MAX_MOMENT_LENGTH} 字`)
  const media = normalizeMomentMedia(input.media ?? [])
  if (!content && !media.length) throw new MomentValidationError('写点什么，或添加图片、视频后再保存')
  if (input.status !== 'draft' && input.status !== 'published') throw new MomentValidationError('发布状态不正确')
  if (input.pinned !== undefined && typeof input.pinned !== 'boolean') throw new MomentValidationError('置顶状态不正确')
  return { content, media: JSON.stringify(media), status: input.status, pinned: input.pinned === true }
}

export function normalizeSocialUrl(value: unknown, platform: 'x' | 'xhs'): string | null {
  if (value === '' || value === null) return null
  if (typeof value === 'string') {
    try {
      const url = new URL(value)
      const allowed = platform === 'x'
        ? ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']
        : ['xiaohongshu.com', 'www.xiaohongshu.com', 'xhslink.com', 'www.xhslink.com', 'xhslink.cn', 'www.xhslink.cn']
      const postPath = platform === 'x' ? /^\/[^/]+\/status\/\d+\/?$/ : /^\/(explore\/|discovery\/item\/|a\/|o\/)/
      if (url.protocol === 'https:' && !url.username && !url.password && !url.port && allowed.includes(url.hostname) && postPath.test(url.pathname)) return url.href
    } catch { /* Report the same validation error for all invalid links. */ }
  }
  throw new MomentValidationError(`请粘贴有效的${platform === 'x' ? ' X 帖子' : '小红书笔记'} HTTPS 链接`)
}

export function momentResponse(record: {
  id: string; content: string; media: string; status: string; pinned: boolean; xUrl: string | null; xhsUrl: string | null
  createdAt: Date; updatedAt: Date; publishedAt: Date | null
}): MomentData {
  return { ...record, media: normalizeMomentMedia(JSON.parse(record.media)), createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(), publishedAt: record.publishedAt?.toISOString() ?? null }
}

export function buildXIntent(content: string, permalink: string) {
  const url = new URL('https://x.com/intent/tweet')
  url.searchParams.set('text', content)
  url.searchParams.set('url', permalink)
  return url.href
}

export function momentShareTitle(content: string) {
  return Array.from(content.split('\n').find(line => line.trim())?.trim() || '分享一刻灵感').slice(0, 20).join('')
}
