import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import {
  buildGitHubProjectMetadata,
  parseGitHubRepositoryUrl,
  parseGitHubPageMetadata,
  type GitHubRepositoryData,
} from '@/lib/github-metadata'

const REQUEST_TIMEOUT_MS = 8_000

function githubHeaders(accept = 'application/vnd.github+json'): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'WebCodingShow',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return headers
}

async function fetchGitHubMetadata(inputUrl: string, signal: AbortSignal) {
  const repositoryRef = parseGitHubRepositoryUrl(inputUrl)
  if (!repositoryRef) return null

  const endpoint = `https://api.github.com/repos/${encodeURIComponent(repositoryRef.owner)}/${encodeURIComponent(repositoryRef.repo)}`
  const [repositoryResult, languagesResult, readmeResult] = await Promise.allSettled([
    fetch(endpoint, { headers: githubHeaders(), signal, cache: 'no-store' }).then(async (response) => {
      if (!response.ok) {
        if (response.status === 404) throw new Error('未找到该 GitHub 仓库，请检查地址或仓库权限')
        if ([403, 429].includes(response.status)) {
          throw new Error('GitHub API 暂时限制了访问，请稍后重试或检查访问凭证')
        }
        throw new Error(`GitHub 仓库读取失败（${response.status}）`)
      }
      return response.json() as Promise<GitHubRepositoryData>
    }),
    fetch(`${endpoint}/languages`, { headers: githubHeaders(), signal, cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('未能读取语言统计')
      return response.json() as Promise<Record<string, number>>
    }),
    fetch(`${endpoint}/readme`, {
      headers: githubHeaders('application/vnd.github.raw+json'),
      signal,
      cache: 'no-store',
    }).then(async (response) => {
      if (response.status === 404) return ''
      if (!response.ok) throw new Error('未能读取 README')
      return response.text()
    }),
  ])

  if (repositoryResult.status === 'rejected') {
    try {
      const page = await fetch(repositoryRef.url, {
        headers: { 'User-Agent': 'WebCodingShow' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      })
      if (page.ok) {
        const metadata = parseGitHubPageMetadata(repositoryRef, await page.text())
        if (metadata) return { ...metadata, partial: true }
      }
    } catch { /* Keep the more actionable API error when both sources fail. */ }
    throw repositoryResult.reason
  }
  const repository = repositoryResult.value
  const languages = languagesResult.status === 'fulfilled' ? languagesResult.value : {}
  const readme = readmeResult.status === 'fulfilled' ? readmeResult.value : ''

  return {
    ...buildGitHubProjectMetadata(repositoryRef, repository, languages, readme),
    partial: languagesResult.status === 'rejected' || readmeResult.status === 'rejected',
  }
}

async function fetchWebMetadata(inputUrl: string, signal: AbortSignal) {
  const response = await fetch(inputUrl, {
    signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`网页读取失败（${response.status}）`)

  const html = await response.text()
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)

  let image = ogImageMatch?.[1]?.trim() || ''
  if (image && !image.startsWith('http')) image = new URL(image, inputUrl).toString()

  return {
    source: 'website' as const,
    title: titleMatch?.[1]?.trim() || '',
    summary: descMatch?.[1]?.trim() || '',
    cover: image,
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const body = await req.json().catch(() => null)
    const inputUrl = typeof body?.url === 'string' ? body.url.trim() : ''
    let parsedUrl: URL
    try {
      parsedUrl = new URL(inputUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol')
    } catch {
      return NextResponse.json({ error: '请输入有效的 http/https 链接' }, { status: 400 })
    }
    if (['github.com', 'www.github.com'].includes(parsedUrl.hostname) && !parseGitHubRepositoryUrl(inputUrl)) {
      return NextResponse.json({ error: '请输入 GitHub 仓库地址，例如 https://github.com/用户名/仓库名' }, { status: 400 })
    }

    const metadata = await fetchGitHubMetadata(inputUrl, controller.signal)
      || await fetchWebMetadata(inputUrl, controller.signal)
    return NextResponse.json(metadata)
  } catch (error: unknown) {
    const message = error instanceof Error && error.name !== 'AbortError'
      ? error.message
      : '解析超时，请稍后重试'
    return NextResponse.json({ error: message }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
