import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { url } = await req.json()
    if (!url || !/^https?:\/\/.+/i.test(url.trim())) {
      return NextResponse.json({ error: '请输入有效的 http/https 链接' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(url.trim(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    clearTimeout(timeout)

    const html = await res.text()

    // 提取 Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    let title = titleMatch ? titleMatch[1].trim() : ''

    // 提取 Description
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    let description = descMatch ? descMatch[1].trim() : ''

    // 提取 og:image 封面
    const ogImageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    let image = ogImageMatch ? ogImageMatch[1].trim() : ''

    // 如果图片是相对路径，转为绝对路径
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).toString()
      } catch {}
    }

    return NextResponse.json({
      title,
      summary: description,
      cover: image,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: '解析网页元数据超时或失败，请手动填写' },
      { status: 500 }
    )
  }
}
