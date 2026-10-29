import { prisma } from '@/lib/prisma'
import { fetchPublicHeaders } from '@/lib/public-web-fetch'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const episode = await prisma.podcastEpisode.findUnique({ where: { id }, select: { audioUrl: true } })
  const headers = { 'Cache-Control': 'no-store' }
  if (!episode) return Response.json({ error: '单集不存在' }, { status: 404, headers })
  try {
    const response = await fetchPublicHeaders(episode.audioUrl, {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
      headers: { Accept: 'audio/*' },
    })
    if (response.status !== 200 || !/^audio\//i.test(response.headers.get('content-type') || '')
      || response.headers.get('cross-origin-resource-policy') === 'same-origin') {
      return Response.json({ error: '音频来源暂时不可用，请稍后重试' }, { status: 502, headers })
    }
    return new Response(null, { status: 307, headers: { ...headers, Location: response.url } })
  } catch {
    return Response.json({ error: '音频地址解析失败，请稍后重试' }, { status: 502, headers })
  }
}
