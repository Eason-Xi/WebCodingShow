import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { MomentValidationError, momentResponse, normalizeMomentInput, normalizeSocialUrl } from '@/lib/moments'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAuthenticated())) return Response.json({ error: '未授权操作' }, { status: 401 })
  try {
    const { id } = await params
    const existing = await prisma.moment.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: '动态不存在' }, { status: 404 })
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new MomentValidationError('动态格式不正确')
    const input = body as Record<string, unknown>
    const data = normalizeMomentInput({ ...existing, media: JSON.parse(existing.media), ...input })
    const socialData = {
      ...(input.xUrl !== undefined ? { xUrl: normalizeSocialUrl(input.xUrl, 'x') } : {}),
      ...(input.xhsUrl !== undefined ? { xhsUrl: normalizeSocialUrl(input.xhsUrl, 'xhs') } : {}),
    }
    if ((socialData.xUrl || socialData.xhsUrl) && data.status !== 'published') throw new MomentValidationError('请先在站内发布动态')
    const moment = await prisma.moment.update({ where: { id }, data: {
      ...data, ...socialData,
      publishedAt: data.status === 'published' ? existing.publishedAt ?? new Date() : existing.publishedAt,
    } })
    return Response.json(momentResponse(moment))
  } catch (error) {
    const invalid = error instanceof MomentValidationError || error instanceof SyntaxError
    if (!invalid) console.error('更新动态失败:', error)
    return Response.json({ error: invalid ? error.message : '更新动态失败，请稍后重试' }, { status: invalid ? 400 : 500 })
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAuthenticated())) return Response.json({ error: '未授权操作' }, { status: 401 })
  try {
    const { id } = await params
    const result = await prisma.moment.deleteMany({ where: { id } })
    return result.count ? Response.json({ success: true }) : Response.json({ error: '动态不存在' }, { status: 404 })
  } catch (error) {
    console.error('删除动态失败:', error)
    return Response.json({ error: '删除失败，请稍后重试' }, { status: 500 })
  }
}
