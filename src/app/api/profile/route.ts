import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    let profile = await prisma.profile.findUnique({
      where: { id: 'default' },
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: 'default',
          name: 'Web 独立创作者',
          title: 'Full-Stack Developer & Creative Coder',
          bio: '专注于探索现代化 Web 交互、AI 工具与创意编程作品。',
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: '获取个人资料失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, title, bio, avatar, githubUrl, xUrl, email } = body

    const profile = await prisma.profile.upsert({
      where: { id: 'default' },
      update: {
        name: name !== undefined ? name.trim() : undefined,
        title: title !== undefined ? title.trim() : undefined,
        bio: bio !== undefined ? bio.trim() : undefined,
        avatar: avatar !== undefined ? (avatar ? avatar.trim() : null) : undefined,
        githubUrl: githubUrl !== undefined ? (githubUrl ? githubUrl.trim() : null) : undefined,
        xUrl: xUrl !== undefined ? (xUrl ? xUrl.trim() : null) : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
      },
      create: {
        id: 'default',
        name: name || 'Web 独立创作者',
        title: title || 'Full-Stack Developer',
        bio: bio || '',
        avatar: avatar || null,
        githubUrl: githubUrl || null,
        xUrl: xUrl || null,
        email: email || null,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: '更新个人资料失败' }, { status: 500 })
  }
}
