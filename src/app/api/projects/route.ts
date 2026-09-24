import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import { normalizeProjectImages } from '@/lib/project-images'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const categoryId = searchParams.get('categoryId') || ''
    const status = (await isAuthenticated())
      ? searchParams.get('status') || 'published'
      : 'published'
    const featured = searchParams.get('featured')
    const sort = searchParams.get('sort') || 'order' // 'order' | 'newest' | 'oldest' | 'title'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12))
    const skip = (page - 1) * limit

    const where: Prisma.ProjectWhereInput = {}

    // 状态过滤 (对于访客前台，强制仅 published；对于后台如果传 all 则不过滤)
    if (status && status !== 'all') {
      where.status = status
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    if (featured === 'true') {
      where.featured = true
    } else if (featured === 'false') {
      where.featured = false
    }

    // 关键词搜索（支持名称、简介、标签）
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
        { tags: { some: { name: { contains: search } } } },
      ]
    }

    // 排序逻辑
    let orderBy: Prisma.ProjectOrderByWithRelationInput[] = [{ sortOrder: 'desc' }, { createdAt: 'desc' }]
    if (sort === 'newest') {
      orderBy = [{ completedAt: 'desc' }, { createdAt: 'desc' }]
    } else if (sort === 'oldest') {
      orderBy = [{ completedAt: 'asc' }, { createdAt: 'asc' }]
    } else if (sort === 'title') {
      orderBy = [{ title: 'asc' }]
    } else if (sort === 'featured') {
      orderBy = [{ featured: 'desc' }, { sortOrder: 'desc' }, { createdAt: 'desc' }]
    }

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          category: true,
          tags: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ])

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取项目失败:', error)
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const body = await req.json()
    let images: string[]
    try { images = normalizeProjectImages(body.images ?? []) } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    const {
      title,
      url,
      summary,
      cover,
      categoryId,
      tags = [],
      status = 'published',
      featured = false,
      sortOrder = 0,
      sourceUrl,
      completedAt,
      description,
    } = body

    // 校验必填项
    if (!title || !title.trim()) {
      return NextResponse.json({ error: '项目名称为必填项' }, { status: 400 })
    }
    if (!url || !url.trim()) {
      return NextResponse.json({ error: '线上 URL 为必填项' }, { status: 400 })
    }
    if (!summary || !summary.trim()) {
      return NextResponse.json({ error: '一句话简介为必填项' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ error: '请选择项目分类' }, { status: 400 })
    }

    // URL 格式校验
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      return NextResponse.json({ error: 'URL 必须以 http:// 或 https:// 开头' }, { status: 400 })
    }

    // 生成唯一 slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
    let slug = baseSlug
    let counter = 1
    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // 处理标签：如果不存在则自动创建，并建立关联
    const tagConnect = []
    if (Array.isArray(tags)) {
      for (const tagName of tags) {
        const cleanTag = typeof tagName === 'string' ? tagName.trim() : ''
        if (!cleanTag) continue
        const tagSlug = cleanTag.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-') || 'tag'
        
        let tag = await prisma.tag.findFirst({
          where: {
            OR: [{ name: cleanTag }, { slug: tagSlug }],
          },
        })
        if (!tag) {
          try {
            tag = await prisma.tag.create({
              data: { name: cleanTag, slug: `${tagSlug}-${Date.now().toString(36)}` },
            })
          } catch {
            tag = await prisma.tag.findFirst({ where: { name: cleanTag } })
          }
        }
        if (tag) {
          tagConnect.push({ id: tag.id })
        }
      }
    }

    const newProject = await prisma.project.create({
      data: {
        title: title.trim(),
        slug,
        url: url.trim(),
        cover: cover ? cover.trim() : null,
        images: JSON.stringify(images),
        summary: summary.trim(),
        description: description ? description.trim() : null,
        categoryId,
        status: status === 'draft' ? 'draft' : 'published',
        featured: Boolean(featured),
        sortOrder: Number(sortOrder) || 0,
        sourceUrl: sourceUrl ? sourceUrl.trim() : null,
        completedAt: completedAt ? completedAt.trim() : null,
        tags: {
          connect: tagConnect,
        },
      },
      include: {
        category: true,
        tags: true,
      },
    })

    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('创建项目失败:', error)
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 })
  }
}
