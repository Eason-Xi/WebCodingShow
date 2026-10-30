import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { MomentValidationError, momentResponse, normalizeMomentInput } from '@/lib/moments'

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' }
  const params = new URL(request.url).searchParams
  const status = params.get('status') || 'published'
  if (!['published', 'draft', 'all'].includes(status)) return Response.json({ error: '无效的筛选状态' }, { status: 400, headers })
  if (status !== 'published' && !(await isAuthenticated())) return Response.json({ error: '未授权操作' }, { status: 401, headers })
  const page = Number(params.get('page') || 1)
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return Response.json({ error: '无效的页码' }, { status: 400, headers })
  try {
    const where = status === 'all' ? {} : { status }
    const [total, moments] = await Promise.all([
      prisma.moment.count({ where }),
      prisma.moment.findMany({ where, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 20, take: 20 }),
    ])
    return Response.json({ moments: moments.map(momentResponse), pagination: { page, total, totalPages: Math.ceil(total / 20) } }, { headers })
  } catch (error) {
    console.error('读取动态失败:', error)
    return Response.json({ error: '读取动态失败，请稍后重试' }, { status: 500, headers })
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: '未授权操作' }, { status: 401 })
  try {
    const data = normalizeMomentInput(await request.json())
    const moment = await prisma.moment.create({ data: { ...data, publishedAt: data.status === 'published' ? new Date() : null } })
    return Response.json(momentResponse(moment), { status: 201 })
  } catch (error) {
    const invalid = error instanceof MomentValidationError || error instanceof SyntaxError
    if (!invalid) console.error('保存动态失败:', error)
    return Response.json({ error: invalid ? error.message : '保存动态失败，请稍后重试' }, { status: invalid ? 400 : 500 })
  }
}
