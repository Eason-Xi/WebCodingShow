import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BlogPostValidationError,
  MAX_BLOG_TAGS,
  blogPostPath,
  blogPostResponse,
  decodeBlogRouteSlug,
  estimateReadingTime,
  insertMarkdownImage,
  normalizeBlogCategory,
  normalizeBlogContent,
  normalizeBlogCover,
  normalizeBlogExcerpt,
  normalizeBlogFeatured,
  normalizeBlogPublishedAt,
  normalizeBlogSlug,
  normalizeBlogStatus,
  normalizeBlogTags,
  normalizeBlogTitle,
  readBlogTags,
  serializeBlogTags,
  slugifyBlogTitle,
} from '../src/lib/blog-post'

test('blog slugs preserve Chinese letters and normalize punctuation', () => {
  assert.equal(slugifyBlogTitle('  Next.js 16：我的第一篇 Blog!  '), 'next-js-16-我的第一篇-blog')
  assert.equal(normalizeBlogSlug('Hello---WORLD'), 'hello-world')
  assert.equal(slugifyBlogTitle('***'), 'post')
})

test('blog routes round-trip Chinese slugs and tolerate malformed escapes', () => {
  assert.equal(blogPostPath('古代遗迹之谜'), '/blog/%E5%8F%A4%E4%BB%A3%E9%81%97%E8%BF%B9%E4%B9%8B%E8%B0%9C')
  assert.equal(decodeBlogRouteSlug('%E5%8F%A4%E4%BB%A3%E9%81%97%E8%BF%B9%E4%B9%8B%E8%B0%9C'), '古代遗迹之谜')
  assert.equal(decodeBlogRouteSlug('next-js-16'), 'next-js-16')
  assert.equal(decodeBlogRouteSlug('%E0%A4%A'), '%E0%A4%A')
})
test('blog tags accept arrays, CSV and persisted JSON while deduplicating', () => {
  assert.deepEqual(normalizeBlogTags(['Next.js', ' next.js ', '产品设计']), ['Next.js', '产品设计'])
  assert.deepEqual(normalizeBlogTags('AI, Web 开发；工程实践'), ['AI', 'Web 开发', '工程实践'])
  assert.deepEqual(normalizeBlogTags('["React","Prisma"]'), ['React', 'Prisma'])
  assert.equal(serializeBlogTags(['React', 'Prisma']), '["React","Prisma"]')
  assert.deepEqual(readBlogTags('not-json-but-one-tag'), ['not-json-but-one-tag'])
  assert.deepEqual(readBlogTags('[invalid'), [])
  assert.throws(() => normalizeBlogTags(Array.from({ length: MAX_BLOG_TAGS + 1 }, (_, index) => `tag-${index}`)), BlogPostValidationError)
})

test('blog cover accepts durable upload paths and safe HTTP URLs', () => {
  assert.equal(normalizeBlogCover(''), null)
  assert.equal(normalizeBlogCover('/api/uploads/cover.webp'), '/api/uploads/cover.webp')
  assert.equal(normalizeBlogCover('/uploads/cover.png'), '/uploads/cover.png')
  assert.equal(normalizeBlogCover('https://cdn.example.com/cover.png'), 'https://cdn.example.com/cover.png')
  for (const value of [
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'https://user:pass@example.com/cover.png',
    '/api/uploads/%2e%2e/secret',
    'blob:https://example.com/session-only',
  ]) {
    assert.throws(() => normalizeBlogCover(value), BlogPostValidationError, value)
  }
})

test('blog field and publication validators reject malformed values', () => {
  assert.equal(normalizeBlogTitle('  标题  '), '标题')
  assert.equal(normalizeBlogContent('  # 正文\n  '), '# 正文')
  assert.equal(normalizeBlogExcerpt('', { allowEmpty: true }), '')
  assert.equal(normalizeBlogContent('   ', { allowEmpty: true }), '')
  assert.equal(normalizeBlogCategory('  技术   随笔 '), '技术 随笔')
  assert.equal(normalizeBlogCategory('  '), null)
  assert.equal(normalizeBlogStatus('draft'), 'draft')
  assert.equal(normalizeBlogFeatured(true), true)
  assert.throws(() => normalizeBlogTitle('   '), BlogPostValidationError)
  assert.throws(() => normalizeBlogStatus('scheduled'), BlogPostValidationError)
  assert.throws(() => normalizeBlogFeatured('true'), BlogPostValidationError)
  assert.throws(() => normalizeBlogPublishedAt('not-a-date'), BlogPostValidationError)
  assert.throws(() => normalizeBlogPublishedAt(new Date(Date.now() + 60 * 60 * 1_000)), BlogPostValidationError)
})

test('reading time accounts for mixed Chinese characters and Latin words', () => {
  assert.equal(estimateReadingTime(''), 1)
  assert.equal(estimateReadingTime('中'.repeat(400)), 1)
  assert.equal(estimateReadingTime('中'.repeat(401)), 2)
  assert.equal(estimateReadingTime(Array.from({ length: 201 }, () => 'word').join(' ')), 2)
  assert.equal(estimateReadingTime(`${'中'.repeat(200)} ${Array.from({ length: 100 }, () => 'word').join(' ')}`), 1)
})

test('uploaded images are inserted as standalone Markdown blocks', () => {
  assert.deepEqual(insertMarkdownImage('', '/api/uploads/photo.webp', '现场图'), {
    content: '![现场图](/api/uploads/photo.webp)\n\n',
    cursor: 33,
  })

  const middle = insertMarkdownImage('开场段落后续段落', 'https://cdn.example.com/a.png', '示意图', 4, 4)
  assert.equal(middle.content, '开场段落\n\n![示意图](https://cdn.example.com/a.png)\n\n后续段落')
  assert.equal(middle.cursor, middle.content.indexOf('后续段落'))

  assert.equal(
    insertMarkdownImage('替换这里', '/image.png', '图[1]', 2, 4).content,
    '替换\n\n![图\\[1\\]](/image.png)\n\n'
  )
})

test('blog API responses expose tags as arrays without mutating other fields', () => {
  const post = { id: 'post-1', title: 'Hello', tags: '["React","Next.js"]' }
  assert.deepEqual(blogPostResponse(post), {
    id: 'post-1',
    title: 'Hello',
    tags: ['React', 'Next.js'],
  })
  assert.equal(post.tags, '["React","Next.js"]')
})
