import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAuthenticated } from '@/lib/auth'
import { MAX_MOMENT_IMAGE_BYTES, MAX_MOMENT_VIDEO_BYTES, MOMENT_MIME_EXTENSIONS, validateMomentFile } from '@/lib/moments'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAuthenticated())) return Response.json({ error: '未授权操作' }, { status: 401 })
  return Response.json({ storage: process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : process.env.VERCEL ? 'unavailable' : 'local' }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  // No completion webhook is used; every request must carry an administrator session.
  if (!(await isAuthenticated())) return Response.json({ error: '未授权操作' }, { status: 401 })
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: '请配置 Vercel Blob 后上传' }, { status: 503 })
      const body = await request.json() as HandleUploadBody
      if (body.type !== 'blob.generate-client-token') return Response.json({ error: '无效的上传请求' }, { status: 400 })
      const result = await handleUpload({ request, body, onBeforeGenerateToken: async (pathname, payload) => {
        const file = JSON.parse(payload || '{}')
        const error = validateMomentFile(file)
        if (error || !new RegExp(`^moments/[a-f0-9-]{36}\\${MOMENT_MIME_EXTENSIONS[file.type]}$`).test(pathname)) throw new Error(error || '上传路径不正确')
        return { allowedContentTypes: [file.type], maximumSizeInBytes: file.type.startsWith('video/') ? MAX_MOMENT_VIDEO_BYTES : MAX_MOMENT_IMAGE_BYTES, addRandomSuffix: false, allowOverwrite: false, validUntil: Date.now() + 10 * 60 * 1000 }
      } })
      return Response.json(result)
    }
    if (process.env.VERCEL) return Response.json({ error: '线上文件须通过 Blob 直传，请刷新后重试' }, { status: 503 })
    if (Number(request.headers.get('content-length')) > MAX_MOMENT_VIDEO_BYTES + 64 * 1024) return Response.json({ error: '文件不能超过 100 MB' }, { status: 413 })
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return Response.json({ error: '请选择上传文件' }, { status: 400 })
    const error = validateMomentFile(file)
    if (error) return Response.json({ error }, { status: 400 })
    const filename = `${randomUUID()}${MOMENT_MIME_EXTENSIONS[file.type]}`
    const directory = path.join(process.cwd(), 'public/uploads/moments')
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: 'wx' })
    return Response.json({ url: `/api/moments/media/${filename}` }, { status: 201 })
  } catch (error) {
    console.error('动态附件上传失败:', error)
    return Response.json({ error: '附件上传失败，请检查文件类型、大小或存储配置后重试' }, { status: 400 })
  }
}
