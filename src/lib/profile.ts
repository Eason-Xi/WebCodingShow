export class ProfileValidationError extends Error {}

export function normalizeAvatar(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new ProfileValidationError('头像地址格式不正确')

  const avatar = value.trim()
  if (!avatar) return null
  if (avatar.startsWith('/api/uploads/') || avatar.startsWith('/uploads/')) return avatar

  try {
    const url = new URL(avatar)
    if (url.protocol === 'http:' || url.protocol === 'https:') return avatar
  } catch {
    // Fall through to the user-facing validation error below.
  }

  throw new ProfileValidationError('头像地址必须是可公开访问的 HTTP(S) 链接')
}
