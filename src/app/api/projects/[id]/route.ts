import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: '项目未找到' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: '获取项目详情失败' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()

    // 检查项目是否存在
    const existing = await prisma.project.findUnique({
      where: { id },
      include: { tags: true },
    })
    if (!existing) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    const {
      title,
      url,
      summary,
      cover,
      categoryId,
      tags,
      status,
      featured,
      sortOrder,
      sourceUrl,
      completedAt,
      description,
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title.trim()
    if (url !== undefined) {
      if (!/^https?:\/\/.+/i.test(url.trim())) {
        return NextResponse.json({ error: 'URL 必须以 http:// 或 https:// 开头' }, { status: 400 })
      }
      updateData.url = url.trim()
    }
    if (summary !== undefined) updateData.summary = summary.trim()
    if (cover !== undefined) updateData.cover = cover ? cover.trim() : null
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (status !== undefined) updateData.status = status
    if (featured !== undefined) updateData.featured = Boolean(featured)
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder)
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl ? sourceUrl.trim() : null
    if (completedAt !== undefined) updateData.completedAt = completedAt ? completedAt.trim() : null
    if (description !== undefined) updateData.description = description ? description.trim() : null

    // 如果传入了 tags，重新绑定标签关联
    if (Array.isArray(tags)) {
      const tagConnect = []
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
      updateData.tags = {
        set: tagConnect,
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        tags: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('更新项目失败:', error)
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.project.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 })
  }
}
