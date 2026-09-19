import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

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
    const { name, slug, sortOrder } = await req.json()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (slug !== undefined) updateData.slug = slug.trim()
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder)

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 })
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
    // 检查是否有项目关联
    const projectCount = await prisma.project.count({
      where: { categoryId: id },
    })

    if (projectCount > 0) {
      return NextResponse.json(
        { error: `该分类下仍有 ${projectCount} 个项目，请先转移或删除关联项目` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}
