import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const CONTENT_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params
    const safeFilename = path.basename(filename)
    if (safeFilename !== filename || !/^[a-zA-Z0-9._-]+$/.test(safeFilename)) {
      throw new Error('Invalid filename')
    }
    const extension = path.extname(safeFilename).toLowerCase()
    const contentType = CONTENT_TYPES[extension]
    if (!contentType) throw new Error('Unsupported file')

    const buffer = await readFile(path.join(process.cwd(), 'public', 'uploads', 'music', safeFilename))
    const range = req.headers.get('range')
    const commonHeaders = {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': contentType,
    }

    if (!range) {
      return new NextResponse(buffer, {
        headers: { ...commonHeaders, 'Content-Length': String(buffer.byteLength) },
      })
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${buffer.byteLength}` },
      })
    }
    const suffixLength = !match[1] && match[2] ? Number(match[2]) : null
    const start = suffixLength === null
      ? (match[1] ? Number(match[1]) : 0)
      : Math.max(buffer.byteLength - suffixLength, 0)
    const end = suffixLength === null && match[2]
      ? Math.min(Number(match[2]), buffer.byteLength - 1)
      : buffer.byteLength - 1
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= buffer.byteLength) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${buffer.byteLength}` },
      })
    }
    const chunk = buffer.subarray(start, end + 1)
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...commonHeaders,
        'Content-Length': String(chunk.byteLength),
        'Content-Range': `bytes ${start}-${end}/${buffer.byteLength}`,
      },
    })
  } catch {
    return NextResponse.json({ error: '音频未找到' }, { status: 404 })
  }
}
