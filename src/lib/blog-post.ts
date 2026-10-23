export const BLOG_POST_STATUSES = ['draft', 'published'] as const
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number]

export const MAX_BLOG_TITLE_LENGTH = 160
export const MAX_BLOG_SLUG_LENGTH = 120
export const MAX_BLOG_EXCERPT_LENGTH = 500
export const MAX_BLOG_CONTENT_LENGTH = 500_000
export const MAX_BLOG_CATEGORY_LENGTH = 80
export const MAX_BLOG_TAG_LENGTH = 40
export const MAX_BLOG_TAGS = 12
export const MAX_BLOG_COVER_LENGTH = 2_048

const CJK_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu
const LATIN_WORD = /[\p{Letter}\p{Number}]+(?:['’-][\p{Letter}\p{Number}]+)*/gu

export class BlogPostValidationError extends Error {}

interface TextOptions {
  allowEmpty?: boolean
}
function normalizedText(value: unknown, label: string, maxLength: number, options: TextOptions = {}): string {
  if (typeof value !== 'string') throw new BlogPostValidationError(`${label}格式不正确`)
  const text = value.trim()
  if (!text && !options.allowEmpty) throw new BlogPostValidationError(`${label}不能为空`)
  if (text.length > maxLength) throw new BlogPostValidationError(`${label}不能超过 ${maxLength} 个字符`)
  return text
}

export function normalizeBlogTitle(value: unknown): string {
  return normalizedText(value, '文章标题', MAX_BLOG_TITLE_LENGTH)
}

export function normalizeBlogExcerpt(value: unknown, options: TextOptions = {}): string {
  return normalizedText(value, '文章摘要', MAX_BLOG_EXCERPT_LENGTH, options)
}

export function normalizeBlogContent(value: unknown, options: TextOptions = {}): string {
  return normalizedText(value, '文章正文', MAX_BLOG_CONTENT_LENGTH, options)
}

export function slugifyBlogTitle(value: string): string {
  const slug = value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BLOG_SLUG_LENGTH)
    .replace(/-+$/g, '')

  return slug || 'post'
}

export function normalizeBlogSlug(value: unknown): string {
  if (typeof value !== 'string') throw new BlogPostValidationError('文章别名格式不正确')
  return slugifyBlogTitle(value)
}

/** Decode a dynamic-route slug before comparing it with the persisted value. */
export function decodeBlogRouteSlug(value: string): string {
  try {
    return decodeURIComponent(value).normalize('NFKC')
  } catch {
    return value.normalize('NFKC')
  }
}

export function blogPostPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`
}

export function normalizeBlogCategory(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new BlogPostValidationError('文章分类格式不正确')
  const category = value.trim().replace(/\s+/g, ' ')
  if (!category) return null
  if (category.length > MAX_BLOG_CATEGORY_LENGTH) {
    throw new BlogPostValidationError(`文章分类不能超过 ${MAX_BLOG_CATEGORY_LENGTH} 个字符`)
  }
  return category
}

export function normalizeBlogStatus(value: unknown): BlogPostStatus {
  if (typeof value === 'string' && BLOG_POST_STATUSES.includes(value as BlogPostStatus)) {
    return value as BlogPostStatus
  }
  throw new BlogPostValidationError('无效的文章发布状态')
}

export function normalizeBlogFeatured(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new BlogPostValidationError('精选状态格式不正确')
  return value
}

export function normalizeBlogTags(value: unknown): string[] {
  let candidates: unknown[]

  if (value === undefined || value === null || value === '') {
    candidates = []
  } else if (Array.isArray(value)) {
    candidates = value
  } else if (typeof value === 'string') {
    const input = value.trim()
    if (!input) return []
    if (input.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(input)
        if (!Array.isArray(parsed)) throw new Error('not an array')
        candidates = parsed
      } catch {
        throw new BlogPostValidationError('文章标签 JSON 格式不正确')
      }
    } else {
      candidates = input.split(/[,,，、;；\n]+/)
    }
  } else {
    throw new BlogPostValidationError('文章标签格式不正确')
  }

  const tags: string[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') throw new BlogPostValidationError('每个文章标签都必须是文字')
    const tag = candidate.trim().replace(/\s+/g, ' ')
    if (!tag) continue
    if (tag.length > MAX_BLOG_TAG_LENGTH) {
      throw new BlogPostValidationError(`单个文章标签不能超过 ${MAX_BLOG_TAG_LENGTH} 个字符`)
    }
    const key = tag.toLocaleLowerCase('zh-CN')
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length > MAX_BLOG_TAGS) {
      throw new BlogPostValidationError(`文章标签最多 ${MAX_BLOG_TAGS} 个`)
    }
  }

  return tags
}

export function serializeBlogTags(value: unknown): string {
  return JSON.stringify(normalizeBlogTags(value))
}

/** Tolerant reader for persisted values and public UI rendering. */
export function readBlogTags(value: unknown): string[] {
  try {
    return normalizeBlogTags(value)
  } catch {
    return []
  }
}

export function normalizeBlogCover(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new BlogPostValidationError('封面地址格式不正确')
  const cover = value.trim()
  if (!cover) return null
  if (cover.length > MAX_BLOG_COVER_LENGTH) {
    throw new BlogPostValidationError(`封面地址不能超过 ${MAX_BLOG_COVER_LENGTH} 个字符`)
  }

  if (cover.startsWith('/api/uploads/') || cover.startsWith('/uploads/')) {
    try {
      const decodedPath = decodeURIComponent(cover.split(/[?#]/, 1)[0])
      if (decodedPath.split('/').includes('..')) throw new Error('path traversal')
    } catch {
      throw new BlogPostValidationError('封面地址格式不正确')
    }
    return cover
  }

  try {
    const url = new URL(cover)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('unsupported URL')
    }
    return cover
  } catch {
    throw new BlogPostValidationError('封面地址必须是上传图片路径或完整的 HTTP(S) 链接')
  }
}

export function normalizeBlogPublishedAt(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (!(typeof value === 'string' || value instanceof Date)) {
    throw new BlogPostValidationError('发布时间格式不正确')
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new BlogPostValidationError('发布时间格式不正确')
  if (date.getTime() > Date.now() + 5 * 60 * 1_000) {
    throw new BlogPostValidationError('当前版本暂不支持定时发布，发布时间不能晚于当前时间')
  }
  return date
}

/** Estimate mixed Chinese/Latin reading time using 400 CJK chars or 200 words per minute. */
export function estimateReadingTime(content: string): number {
  if (typeof content !== 'string' || !content.trim()) return 1
  const cjkMatches = content.match(CJK_CHARACTER) ?? []
  const nonCjk = content.replace(CJK_CHARACTER, ' ')
  const wordMatches = nonCjk.match(LATIN_WORD) ?? []
  return Math.max(1, Math.ceil(cjkMatches.length / 400 + wordMatches.length / 200))
}

export interface MarkdownImageInsertion {
  content: string
  cursor: number
}

/** Insert an uploaded image as its own Markdown block and place the cursor after it. */
export function insertMarkdownImage(
  content: string,
  url: string,
  alt = '文章图片',
  selectionStart = content.length,
  selectionEnd = selectionStart
): MarkdownImageInsertion {
  const start = Math.min(Math.max(0, selectionStart), content.length)
  const end = Math.min(Math.max(start, selectionEnd), content.length)
  const before = content.slice(0, start)
  const after = content.slice(end)
  const safeAlt = (alt.trim() || '文章图片')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
  const markdown = `![${safeAlt}](${url})`
  const leading = before.length === 0 || before.endsWith('\n\n')
    ? ''
    : before.endsWith('\n') ? '\n' : '\n\n'
  const trailing = after.startsWith('\n\n')
    ? ''
    : after.startsWith('\n') ? '\n' : '\n\n'
  const insertion = `${leading}${markdown}${trailing}`

  return {
    content: `${before}${insertion}${after}`,
    cursor: before.length + insertion.length,
  }
}

export function blogPostResponse<T extends { tags: string }>(post: T): Omit<T, 'tags'> & { tags: string[] } {
  return { ...post, tags: readBlogTags(post.tags) }
}
