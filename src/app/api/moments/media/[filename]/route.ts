import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { MOMENT_MIME_EXTENSIONS } from '@/lib/moments'
import { parseMediaRange } from '@/lib/media-range'

export const runtime = 'nodejs'

async function serve(request: Request, { params }: { params: Promise<{ filename: string }> }, head = false) {
  const { filename } = await params
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/.test(filename)) return new Response(null, { status: 404 })
  try {
    const filePath = path.join(process.cwd(), 'public/uploads/moments', filename)
    const { size } = await stat(filePath)
    const range = parseMediaRange(request.headers.get('range'), size)
    const type = Object.entries(MOMENT_MIME_EXTENSIONS).find(([, ext]) => filename.endsWith(ext))?.[0]
    const headers: Record<string, string> = {
      'Content-Type': type || 'application/octet-stream', 'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff',
    }
    if (new URL(request.url).searchParams.has('download')) headers['Content-Disposition'] = `attachment; filename="${filename}"`
    if (range === 'invalid') return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } })
    const { start, end } = range || { start: 0, end: size - 1 }
    headers['Content-Length'] = String(end - start + 1)
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${size}`
    const stream = head ? null : Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>
    return new Response(stream, { status: range ? 206 : 200, headers })
  } catch { return new Response(null, { status: 404 }) }
}

export async function GET(request: Request, context: { params: Promise<{ filename: string }> }) { return serve(request, context) }
export async function HEAD(request: Request, context: { params: Promise<{ filename: string }> }) { return serve(request, context, true) }
