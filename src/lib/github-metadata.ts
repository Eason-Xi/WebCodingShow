export interface GitHubRepositoryRef {
  owner: string
  repo: string
  url: string
}

export interface GitHubRepositoryData {
  name: string
  full_name: string
  html_url: string
  homepage?: string | null
  description?: string | null
  topics?: string[]
  language?: string | null
  pushed_at?: string | null
  stargazers_count?: number
  forks_count?: number
  open_graph_image_url?: string | null
  license?: { spdx_id?: string | null } | null
}

export interface GitHubProjectMetadata {
  source: 'github'
  title: string
  summary: string
  cover: string
  url: string
  sourceUrl: string
  tags: string[]
  completedAt: string
  description: string
}

const GITHUB_NAME = /^[A-Za-z0-9_.-]+$/
const RESERVED_GITHUB_PATHS = new Set([
  'about', 'collections', 'customer-stories', 'enterprise', 'events', 'features',
  'marketplace', 'new', 'notifications', 'organizations', 'orgs', 'pricing',
  'search', 'settings', 'sponsors', 'topics', 'trending', 'users',
])

export function parseGitHubRepositoryUrl(input: string): GitHubRepositoryRef | null {
  try {
    const url = new URL(input.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null
    if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) return null

    const [owner, rawRepo] = url.pathname.split('/').filter(Boolean)
    const repo = rawRepo?.replace(/\.git$/i, '')
    if (
      !owner || !repo || RESERVED_GITHUB_PATHS.has(owner.toLowerCase())
      || !GITHUB_NAME.test(owner) || !GITHUB_NAME.test(repo)
    ) return null

    return { owner, repo, url: `https://github.com/${owner}/${repo}` }
  } catch {
    return null
  }
}

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncate(value: string, limit: number): string {
  const text = compactText(value)
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 1).replace(/\s+\S*$/, '')}…`
}

export function extractReadmeSummary(readme: string): string {
  const cleaned = readme
    .replace(/<(script|style|svg|pre|h[1-6])\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(?:p|div|li|tr)>/gi, '\n\n')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+>]\s+/gm, '')
      .replace(/[`*_~|]/g, ' '))
    .map(compactText)
    .filter((paragraph) => paragraph.length >= 24)
    .filter((paragraph) => !/^(table of contents|目录|installation|安装|usage|使用方法)$/i.test(paragraph))

  return truncate(paragraphs[0] || '', 420)
}

function validHomepage(homepage?: string | null): string | null {
  if (!homepage) return null
  try {
    const url = new URL(homepage)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export function buildGitHubProjectMetadata(
  ref: GitHubRepositoryRef,
  repository: GitHubRepositoryData,
  languages: Record<string, number>,
  readme: string,
): GitHubProjectMetadata {
  const languageNames = Object.entries(languages)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5)
    .map(([name]) => name)
  if (repository.language && !languageNames.includes(repository.language)) {
    languageNames.unshift(repository.language)
  }

  const tags: string[] = []
  const seen = new Set<string>()
  const readmeTechnologies = [
    'TypeScript', 'JavaScript', 'Python', 'React', 'Next.js', 'Vue', 'Nuxt', 'Svelte',
    'Tailwind CSS', 'Node.js', 'Prisma', 'PostgreSQL', 'SQLite', 'MySQL', 'Redis',
    'Docker', 'FastAPI', 'Django', 'Flask', 'Go', 'Rust', 'Swift', 'Kotlin',
  ].filter((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(readme))
  for (const tag of [...(repository.topics || []), ...languageNames, ...readmeTechnologies]) {
    const cleaned = compactText(tag)
    const key = cleaned.toLowerCase()
    if (cleaned && !seen.has(key)) {
      tags.push(cleaned)
      seen.add(key)
    }
    if (tags.length >= 12) break
  }

  const readmeSummary = extractReadmeSummary(readme)
  const repositorySummary = compactText(repository.description || '')
  const summary = truncate(repositorySummary || readmeSummary || `${repository.name} GitHub 项目`, 180)

  const details = [
    repositorySummary,
    readmeSummary && readmeSummary !== repositorySummary ? readmeSummary : '',
    languageNames.length ? `主要技术：${languageNames.join('、')}` : '',
    readmeTechnologies.length ? `README 中的技术：${readmeTechnologies.join('、')}` : '',
    repository.topics?.length ? `GitHub Topics：${repository.topics.join('、')}` : '',
    `GitHub：${repository.stargazers_count || 0} Stars · ${repository.forks_count || 0} Forks${repository.license?.spdx_id ? ` · ${repository.license.spdx_id}` : ''}`,
  ].filter(Boolean)

  return {
    source: 'github',
    title: repository.name,
    summary,
    cover: repository.open_graph_image_url || `https://opengraph.githubassets.com/1/${ref.owner}/${ref.repo}`,
    url: validHomepage(repository.homepage) || repository.html_url || ref.url,
    sourceUrl: repository.html_url || ref.url,
    tags,
    completedAt: repository.pushed_at?.slice(0, 7) || '',
    description: details.join('\n\n'),
  }
}

interface GitHubPagePayload {
  codeViewLayoutRoute?: { repo?: { name?: string; ownerLogin?: string } }
  codeViewRepoRoute?: { overview?: { overviewFiles?: { preferredFileType?: string; richText?: string }[] } }
  sidebarAbout?: { website?: string; description?: string; topics?: (string | { name: string })[]; stargazerCount?: number; forksCount?: number }
}

// Public pages remain readable when the anonymous REST API quota is exhausted.
export function parseGitHubPageMetadata(ref: GitHubRepositoryRef, html: string): GitHubProjectMetadata | null {
  for (const match of html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let payload: GitHubPagePayload | undefined
    try {
      payload = (JSON.parse(match[1]) as { payload?: GitHubPagePayload }).payload
    } catch { continue }
    const repo = payload?.codeViewLayoutRoute?.repo
    if (!repo?.name || !repo.ownerLogin) continue
    const about = payload?.sidebarAbout
    const readme = payload?.codeViewRepoRoute?.overview?.overviewFiles
      ?.find((file) => file.preferredFileType === 'readme')?.richText || ''
    return buildGitHubProjectMetadata(ref, {
      name: repo.name,
      full_name: `${repo.ownerLogin}/${repo.name}`,
      html_url: `https://github.com/${repo.ownerLogin}/${repo.name}`,
      homepage: about?.website,
      description: about?.description,
      topics: about?.topics?.map((topic) => typeof topic === 'string' ? topic : topic.name),
      stargazers_count: about?.stargazerCount,
      forks_count: about?.forksCount,
      open_graph_image_url: html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1],
    }, {}, readme)
  }
  return null
}
