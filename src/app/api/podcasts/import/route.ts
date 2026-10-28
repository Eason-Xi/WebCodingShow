import { isAuthenticated } from '@/lib/auth'
import { importPodcast } from '@/lib/podcast-import'
export const maxDuration = 60
export async function POST(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: '请先登录管理员账号' }, { status: 401 })
  try {
    const body = await request.json()
    if (typeof body.url !== 'string') throw new Error('请输入 RSS 地址')
    return Response.json(await importPodcast(body.url))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '导入失败，请稍后重试' }, { status: 400 })
  }
}
