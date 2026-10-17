import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { fetchProjectMetadata } from '@/lib/project-metadata'
import { normalizeProjectUrl, ProjectImportError } from '@/lib/project-url'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => null)
    const url = normalizeProjectUrl(typeof body?.url === 'string' ? body.url : '')
    return NextResponse.json(await fetchProjectMetadata(url))
  } catch (error) {
    return NextResponse.json({ error: error instanceof ProjectImportError ? error.message : '解析失败，请稍后重试' },
      { status: error instanceof ProjectImportError ? error.status : 502 })
  }
}
