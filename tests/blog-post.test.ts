import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BlogPostValidationError,
  MAX_BLOG_TAGS,
  blogPostResponse,
  estimateReadingTime,
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

test('blog API responses expose tags as arrays without mutating other fields', () => {
  const post = { id: 'post-1', title: 'Hello', tags: '["React","Next.js"]' }
  assert.deepEqual(blogPostResponse(post), {
    id: 'post-1',
    title: 'Hello',
    tags: ['React', 'Next.js'],
  })
  assert.equal(post.tags, '["React","Next.js"]')
})
