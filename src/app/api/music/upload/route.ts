import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { AUDIO_EXTENSIONS, MAX_AUDIO_BYTES, validateAudioFile } from '@/lib/music'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权操作' }, { status: 401 })
  }

  try {
    if (Number(req.headers.get('content-length')) > MAX_AUDIO_BYTES + 64 * 1024) {
      return NextResponse.json({ error: '音频不能超过 25 MB' }, { status: 413 })
    }
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未选择上传文件' }, { status: 400 })
    }
    const error = validateAudioFile(file)
    if (error) return NextResponse.json({ error }, { status: 400 })

    const fileName = `${randomUUID()}${AUDIO_EXTENSIONS[file.type]}`
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`music/${fileName}`, file, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      return NextResponse.json({ url: blob.url })
    }
    if (process.env.VERCEL) {
      return NextResponse.json({ error: '音频存储尚未配置，请连接 Vercel Blob' }, { status: 503 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ url: `/api/music/files/${fileName}` })
  } catch (error) {
    console.error('上传音频失败:', error)
    return NextResponse.json({ error: '上传音频失败' }, { status: 500 })
  }
}
