import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { importProject } from '@/lib/project-import'
import { ProjectImportError } from '@/lib/project-url'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: '登录已过期，请重新登录后导入' }, { status: 401 })
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ProjectImportError('请输入项目地址')
    const result = await importProject(prisma, { url: body.url, categoryId: body.categoryId })
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 })
  } catch (error) {
    if (error instanceof ProjectImportError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('链接导入失败:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: '保存失败，请重试。重复提交同一地址不会新增副本。' }, { status: 500 })
  }
}
