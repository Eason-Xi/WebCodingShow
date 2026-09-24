export const MAX_PROJECT_IMAGES = 20

export function isProjectImageUrl(value: string): boolean {
  if (/^\/(?:api\/)?uploads\/[^\s?#]+$/.test(value)) return true
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}

export function normalizeProjectImages(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_PROJECT_IMAGES) {
    throw new Error(`作品图片必须为数组，最多 ${MAX_PROJECT_IMAGES} 张`)
  }
  const images = value.map((item) => {
    if (typeof item !== 'string' || !isProjectImageUrl(item.trim())) {
      throw new Error('图片地址须为已上传图片或有效的 http/https 链接')
    }
    return item.trim()
  })
  return [...new Set(images)]
}

export function readProjectImages(value?: string | null): string[] {
  try { return normalizeProjectImages(JSON.parse(value || '[]')) } catch { return [] }
}

export function projectGallery(cover?: string | null, images?: string | null): string[] {
  return [...new Set([cover, ...readProjectImages(images)].filter((url): url is string => Boolean(url)))]
}
