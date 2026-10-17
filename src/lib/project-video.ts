export function normalizeProjectVideoUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw new Error('视频链接须为有效的 http/https 地址')
  const input = value.trim()
  if (!input) return null
  try {
    const url = new URL(input)
    if (input.length > 2048 || /\s/.test(input) || !/^https?:\/\//i.test(input)
      || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error()
    return url.href
  } catch {
    throw new Error('视频链接须为不含账号密码的完整 http/https 地址，最多 2048 字符')
  }
}

export function readProjectVideoUrl(value?: string | null): string | null {
  try { return normalizeProjectVideoUrl(value) } catch { return null }
}
