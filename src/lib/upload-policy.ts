export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
}
export function validateImage(file: { type: string; size: number }): string | null {
  return !IMAGE_EXTENSIONS[file.type] || file.size === 0 || file.size > MAX_IMAGE_BYTES
    ? '请上传 4 MB 以内的 PNG、JPEG、WebP 或 GIF 图片'
    : null
}
