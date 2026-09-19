import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const [
      totalProjects,
      publishedProjects,
      draftProjects,
      featuredProjects,
      totalCategories,
      recentProjects,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'published' } }),
      prisma.project.count({ where: { status: 'draft' } }),
      prisma.project.count({ where: { featured: true } }),
      prisma.category.count(),
      prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { category: true },
      }),
    ])

    return NextResponse.json({
      totalProjects,
      publishedProjects,
      draftProjects,
      featuredProjects,
      totalCategories,
      recentProjects,
    })
  } catch (error) {
    return NextResponse.json({ error: '获取统计指标失败' }, { status: 500 })
  }
}
