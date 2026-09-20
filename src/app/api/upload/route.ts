import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { IMAGE_EXTENSIONS, MAX_IMAGE_BYTES, validateImage } from '@/lib/upload-policy'

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    if (Number(req.headers.get('content-length')) > MAX_IMAGE_BYTES + 64 * 1024) {
      return NextResponse.json({ error: '图片不能超过 4 MB' }, { status: 413 })
    }
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未选择上传文件' }, { status: 400 })
    }

    const error = validateImage(file)
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    const fileName = `${randomUUID()}${IMAGE_EXTENSIONS[file.type]}`
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${fileName}`, file, {
        access: 'public', contentType: file.type, addRandomSuffix: false,
      })
      return NextResponse.json({ url: blob.url })
    }
    if (process.env.VERCEL) {
      return NextResponse.json({ error: '图片存储尚未配置，请连接 Vercel Blob' }, { status: 503 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 创建 uploads 文件夹
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // 生成安全文件名
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/api/uploads/${fileName}` })
  } catch (error) {
    console.error('上传图片失败:', error)
    return NextResponse.json({ error: '上传图片失败' }, { status: 500 })
  }
}
