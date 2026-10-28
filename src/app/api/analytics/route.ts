import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { isAnalyticsBot, isAnalyticsOrigin, parseAnalyticsInput } from '@/lib/analytics-policy'
import { recordAnalytics } from '@/lib/analytics'

export async function POST(request: Request) {
  // Fetch from our client always supplies Origin. Reject cross-site submissions and oversized payloads.
  if (!isAnalyticsOrigin(request.headers)) {
    return NextResponse.json({ error: '无效来源' }, { status: 403 })
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return NextResponse.json({ error: '无效格式' }, { status: 415 })
  }
  if (Number(request.headers.get('content-length') || 0) > 1024) return new NextResponse(null, { status: 413 })
  try {
    if (await isAuthenticated() || isAnalyticsBot(request.headers.get('user-agent') || '')) {
      return new NextResponse(null, { status: 204 })
    }
    const text = await request.text()
    if (text.length > 1024) return new NextResponse(null, { status: 413 })
    let body: unknown
    try { body = JSON.parse(text) } catch { return NextResponse.json({ error: '无效数据' }, { status: 400 }) }
    const input = parseAnalyticsInput(body)
    if (!input) return NextResponse.json({ error: '无效统计事件' }, { status: 400 })
    const result = await recordAnalytics(input)
    return new NextResponse(null, { status: result === 'unavailable' ? 404 : 204 })
  } catch (error) {
    console.error('记录内容统计失败:', error)
    return NextResponse.json({ error: '统计暂不可用' }, { status: 503 })
  }
}
