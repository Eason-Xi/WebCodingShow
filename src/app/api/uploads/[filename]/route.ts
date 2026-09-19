import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// 动态提供上传文件，不受 Next.js 静态清单限制
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    // 防止目录遍历攻击
    const safeFilename = path.basename(filename)
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename)

    const buffer = await readFile(filePath)

    // 识别 MIME 类型
    const ext = path.extname(safeFilename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    }
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '图片未找到' }, { status: 404 })
  }
}
