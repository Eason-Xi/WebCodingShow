import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'desc' },
      include: {
        _count: {
          select: {
            projects: {
              where: { status: 'published' }
            }
          }
        }
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const { name, slug, sortOrder = 0 } = await req.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '分类名称为必填项' }, { status: 400 })
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        sortOrder: Number(sortOrder) || 0,
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建分类失败或别名已存在' }, { status: 500 })
  }
}
