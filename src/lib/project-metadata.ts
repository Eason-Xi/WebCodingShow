import {
  buildGitHubProjectMetadata,
  parseGitHubRepositoryUrl,
  parseGitHubPageMetadata,
  type GitHubRepositoryData,
} from './github-metadata'
import { fetchPublicText } from './public-web-fetch'
import { normalizeProjectUrl, ProjectImportError } from './project-url'
import { parseWebsiteMetadata, type ProjectMetadata } from './website-metadata'

async function fetchResource(url: string, options: { headers: Record<string, string>; signal: AbortSignal }) {
  const response = await fetchPublicText(url, options)
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => JSON.parse(response.text),
    text: async () => response.text,
  }
}

function githubHeaders(accept = 'application/vnd.github+json'): Record<string, string> {
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
    fetchResource(endpoint, { headers: githubHeaders(), signal }).then(async (response) => {
      if (!response.ok) {
        if (response.status === 404) throw new Error('未找到该 GitHub 仓库，请检查地址或仓库权限')
        if ([403, 429].includes(response.status)) {
          throw new Error('GitHub API 暂时限制了访问，请稍后重试或检查访问凭证')
        }
        throw new Error(`GitHub 仓库读取失败（${response.status}）`)
      }
      return response.json() as Promise<GitHubRepositoryData>
    }),
    fetchResource(`${endpoint}/languages`, { headers: githubHeaders(), signal }).then(async (response) => {
      if (!response.ok) throw new Error('未能读取语言统计')
      return response.json() as Promise<Record<string, number>>
    }),
    fetchResource(`${endpoint}/readme`, {
      headers: githubHeaders('application/vnd.github.raw+json'),
      signal,
    }).then(async (response) => {
      if (response.status === 404) return ''
      if (!response.ok) throw new Error('未能读取 README')
      return response.text()
    }),
  ])

  if (repositoryResult.status === 'rejected') {
    try {
      const page = await fetchResource(repositoryRef.url, {
        headers: { 'User-Agent': 'WebCodingShow' },
        signal,
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

export async function fetchProjectMetadata(inputUrl: string): Promise<ProjectMetadata> {
  const url = normalizeProjectUrl(inputUrl)
  const signal = AbortSignal.timeout(15_000)
  try {
    const github = await fetchGitHubMetadata(url, signal)
    if (github) return github
    const response = await fetchPublicText(url, { signal })
    if (response.status < 200 || response.status >= 300) {
      throw new ProjectImportError(`网页读取失败（${response.status}），请检查地址是否可公开访问`, 502)
    }
    const type = response.headers.get('content-type') || ''
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      throw new ProjectImportError('此链接不是网页，请使用项目首页或 GitHub 仓库地址', 422)
    }
    return parseWebsiteMetadata(response.text, response.url)
  } catch (error) {
    if (error instanceof ProjectImportError) throw error
    if (signal.aborted) throw new ProjectImportError('读取超时，请稍后重试；本次未保存项目', 504)
    const message = error instanceof Error && error.message.startsWith('GitHub')
      || error instanceof Error && error.message.startsWith('未找到该 GitHub')
      ? error.message : '无法读取项目地址，请确认网页可公开访问后重试'
    throw new ProjectImportError(message, 502)
  }
}
