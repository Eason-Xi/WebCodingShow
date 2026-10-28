import { todayMetrics } from '@/lib/analytics'
import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import {
  BlogPostValidationError,
  MAX_BLOG_SLUG_LENGTH,
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
  normalizeBlogTitle,
  serializeBlogTags,
  slugifyBlogTitle,
} from '@/lib/blog-post'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
class BlogPostSlugConflictError extends Error {}

function slugCandidate(base: string, attempt: number): string {
  if (attempt === 0) return base
  const suffix = `-${attempt}`
  const prefix = base.slice(0, MAX_BLOG_SLUG_LENGTH - suffix.length).replace(/-+$/g, '') || 'post'
  return `${prefix}${suffix}`
}

async function availableSlug(base: string, allowSuffix: boolean): Promise<string> {
  for (let attempt = 0; attempt < 1_000; attempt++) {
    const slug = slugCandidate(base, attempt)
    if (!(await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } }))) return slug
    if (!allowSuffix) throw new BlogPostSlugConflictError('文章别名已存在')
  }
  throw new BlogPostValidationError('无法生成唯一的文章别名，请手动填写其他别名')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const authed = await isAuthenticated()
    const requestedStatus = searchParams.get('status')?.trim() || (authed ? 'all' : 'published')
    if (!authed && requestedStatus !== 'published') {
      // Anonymous callers can request any filter, but the result is always public-only.
    } else if (requestedStatus !== 'all') {
      normalizeBlogStatus(requestedStatus)
    }

    const status = authed ? requestedStatus : 'published'
    const search = searchParams.get('search')?.trim().slice(0, 200) || ''
    const category = searchParams.get('category')?.trim().slice(0, 80) || ''
    const featured = searchParams.get('featured')
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '12', 10) || 12))
    const where: Prisma.BlogPostWhereInput = {}

    if (status !== 'all') where.status = status
    if (category) where.category = category
    if (featured === 'true') where.featured = true
    else if (featured === 'false') where.featured = false
    else if (featured !== null && featured !== '') {
      throw new BlogPostValidationError('精选筛选只能是 true 或 false')
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
        { category: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    let orderBy: Prisma.BlogPostOrderByWithRelationInput[] = [
      { featured: 'desc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ]
    if (sort === 'views' && authed) orderBy = [{ viewCount: 'desc' }, { id: 'asc' }]
    else if (sort === 'oldest') orderBy = [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
    else if (sort === 'updated') orderBy = [{ updatedAt: 'desc' }]
    else if (sort === 'title') orderBy = [{ title: 'asc' }]
    else if (sort !== 'newest' && sort !== 'featured') {
      throw new BlogPostValidationError('无效的文章排序方式')
    } else if (sort === 'newest') {
      orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    }

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const today = authed ? await todayMetrics('post', posts.map(p => p.id)) : new Map()
    return NextResponse.json({
      posts: posts.map(p => ({ ...blogPostResponse(p), ...(authed ? { todayViews: today.get(p.id)?.views ?? 0 } : {}) })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取文章失败'
    const status = error instanceof BlogPostValidationError ? 400 : 500
    if (status === 500) console.error('获取文章失败:', error)
    return NextResponse.json({ error: status === 500 ? '获取文章失败' : message }, { status })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const body: unknown = await req.json()
    if (!isObject(body)) throw new BlogPostValidationError('文章数据格式不正确')

    const status = body.status === undefined ? 'draft' : normalizeBlogStatus(body.status)
    const title = normalizeBlogTitle(body.title)
    const excerpt = normalizeBlogExcerpt(body.excerpt ?? '', { allowEmpty: status === 'draft' })
    const content = normalizeBlogContent(body.content ?? '', { allowEmpty: status === 'draft' })
    const requestedPublishedAt = normalizeBlogPublishedAt(body.publishedAt)
    const publishedAt = status === 'published'
      ? requestedPublishedAt ?? new Date()
      : requestedPublishedAt ?? null
    const hasManualSlug = typeof body.slug === 'string' && Boolean(body.slug.trim())
    const requestedSlug = hasManualSlug
      ? normalizeBlogSlug(body.slug)
      : slugifyBlogTitle(title)
    const slug = await availableSlug(requestedSlug, !hasManualSlug)

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        cover: normalizeBlogCover(body.cover),
        tags: serializeBlogTags(body.tags),
        category: normalizeBlogCategory(body.category),
        status,
        featured: body.featured === undefined ? false : normalizeBlogFeatured(body.featured),
        readingTime: estimateReadingTime(content),
        publishedAt,
      },
    })

    return NextResponse.json(blogPostResponse(post), { status: 201 })
  } catch (error) {
    const conflict = error instanceof BlogPostSlugConflictError || (isObject(error) && error.code === 'P2002')
    const badRequest = error instanceof BlogPostValidationError
    if (!conflict && !badRequest) console.error('创建文章失败:', error)
    return NextResponse.json(
      { error: conflict ? '文章别名已存在' : badRequest ? error.message : '创建文章失败' },
      { status: conflict ? 409 : badRequest ? 400 : 500 },
    )
  }
}
