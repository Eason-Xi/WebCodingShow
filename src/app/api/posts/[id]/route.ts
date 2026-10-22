import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import {
  BlogPostValidationError,
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
} from '@/lib/blog-post'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
class BlogPostSlugConflictError extends Error {}

async function availableSlug(base: string, currentId: string): Promise<string> {
  const match = await prisma.blogPost.findUnique({ where: { slug: base }, select: { id: true } })
  if (match && match.id !== currentId) throw new BlogPostSlugConflictError('文章别名已存在')
  return base
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const authed = await isAuthenticated()
    const post = await prisma.blogPost.findFirst({
      where: authed ? { id } : { id, status: 'published' },
    })
    if (!post) return NextResponse.json({ error: '文章未找到' }, { status: 404 })
    return NextResponse.json(blogPostResponse(post))
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return NextResponse.json({ error: '获取文章详情失败' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body: unknown = await req.json()
    if (!isObject(body)) throw new BlogPostValidationError('文章数据格式不正确')

    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: '文章未找到' }, { status: 404 })

    const data: Prisma.BlogPostUpdateInput = {}
    const status = body.status === undefined ? existing.status : normalizeBlogStatus(body.status)
    let nextExcerpt: string | undefined
    let nextContent: string | undefined
    if (body.title !== undefined) data.title = normalizeBlogTitle(body.title)
    if (body.excerpt !== undefined) {
      nextExcerpt = normalizeBlogExcerpt(body.excerpt, { allowEmpty: true })
      data.excerpt = nextExcerpt
    }
    if (body.content !== undefined) {
      nextContent = normalizeBlogContent(body.content, { allowEmpty: true })
      data.content = nextContent
      data.readingTime = estimateReadingTime(nextContent)
    }
    if (body.cover !== undefined) data.cover = normalizeBlogCover(body.cover)
    if (body.tags !== undefined) data.tags = serializeBlogTags(body.tags)
    if (body.category !== undefined) data.category = normalizeBlogCategory(body.category)
    if (body.featured !== undefined) data.featured = normalizeBlogFeatured(body.featured)
    if (body.slug !== undefined) {
      data.slug = await availableSlug(normalizeBlogSlug(body.slug), id)
    }

    if (status === 'published') {
      normalizeBlogExcerpt(nextExcerpt ?? existing.excerpt)
      normalizeBlogContent(nextContent ?? existing.content)
    }
    if (body.status !== undefined) data.status = status
    const publishedAt = normalizeBlogPublishedAt(body.publishedAt)
    if (status === 'published' && (publishedAt === null || (publishedAt === undefined && !existing.publishedAt))) {
      data.publishedAt = new Date()
    } else if (publishedAt !== undefined) {
      data.publishedAt = publishedAt
    }

    const post = await prisma.blogPost.update({ where: { id }, data })
    return NextResponse.json(blogPostResponse(post))
  } catch (error) {
    const conflict = error instanceof BlogPostSlugConflictError || (isObject(error) && error.code === 'P2002')
    const badRequest = error instanceof BlogPostValidationError
    if (!conflict && !badRequest) console.error('更新文章失败:', error)
    return NextResponse.json(
      { error: conflict ? '文章别名已存在' : badRequest ? error.message : '更新文章失败' },
      { status: conflict ? 409 : badRequest ? 400 : 500 },
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const { id } = await params
    const deleted = await prisma.blogPost.deleteMany({ where: { id } })
    if (!deleted.count) return NextResponse.json({ error: '文章未找到' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除文章失败:', error)
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 })
  }
}
