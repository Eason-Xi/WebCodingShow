import { isIP } from 'node:net'
import { parseGitHubRepositoryUrl } from './github-metadata'

export class ProjectImportError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export function isPublicAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, '')
  if (isIP(ip) === 4) {
    const [a, b, c] = ip.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
      || (a === 198 && [18, 19].includes(b))
      || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113))
  }
  // Only globally routed IPv6; exclude mapped IPv4, transition and documentation ranges.
  return isIP(ip) === 6 && /^[23]/.test(ip)
    && !/^2001:(?:0:|db8:|[12][0-9a-f]:)/.test(ip)
    && !ip.startsWith('2002:') && !ip.startsWith('3fff:')
}

export function validateProjectUrl(input: unknown): URL {
  if (typeof input !== 'string' || input.trim().length > 2048) {
    throw new ProjectImportError('请输入不超过 2048 字符的项目地址')
  }
  let url: URL
  try { url = new URL(input.trim()) } catch {
    throw new ProjectImportError('请输入完整的 http:// 或 https:// 项目地址')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new ProjectImportError('项目地址仅支持不含账号密码的 http/https 链接')
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (url.port || !host.includes('.') && !isIP(host)
    || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)
    || (isIP(host) && !isPublicAddress(host))) {
    throw new ProjectImportError('请使用公开网站地址，不支持本机、内网或自定义端口')
  }
  return url
}

export function normalizeProjectUrl(input: string): string {
  const url = validateProjectUrl(input)
  const github = parseGitHubRepositoryUrl(url.toString())
  if (github) return github.url.toLowerCase()
  if (['github.com', 'www.github.com'].includes(url.hostname)) {
    throw new ProjectImportError('请输入 GitHub 仓库地址，例如 https://github.com/用户名/仓库名')
  }
  url.hash = ''
  url.hostname = url.hostname.replace(/\.$/, '')
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  // Root slash and trailing path slashes should not create duplicate projects.
  return url.toString().replace(/\/(?=\?|$)/, '')
}
