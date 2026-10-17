export interface ProjectMetadata {
  source: 'github' | 'website'
  title: string
  summary: string
  cover: string
  url: string
  sourceUrl?: string
  tags?: string[]
  completedAt?: string
  description?: string
  partial?: boolean
}

function decodeText(value: string): string {
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—' }
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] || match
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1))
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : ''
  }).replace(/\s+/g, ' ').trim()
}

export function parseWebsiteMetadata(html: string, finalUrl: string): ProjectMetadata {
  const source = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  const meta = new Map<string, string>()
  for (const match of source.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attributes = new Map<string, string>()
    for (const attr of match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attributes.set(attr[1].toLowerCase(), decodeText(attr[2] ?? attr[3] ?? attr[4]))
    }
    const key = (attributes.get('property') || attributes.get('name') || '').toLowerCase()
    if (key && !meta.has(key)) meta.set(key, attributes.get('content') || '')
  }
  const title = meta.get('og:title') || meta.get('twitter:title')
    || decodeText(source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
  const summary = meta.get('og:description') || meta.get('description') || meta.get('twitter:description') || ''
  const image = meta.get('og:image') || meta.get('twitter:image') || ''
  let cover = ''
  if (image) {
    try {
      const url = new URL(image, finalUrl)
      if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) cover = url.toString()
    } catch { /* A broken image does not prevent saving the remaining metadata. */ }
  }
  const tags = [...new Set((meta.get('keywords') || '').split(/[,，、;；]/).map((tag) => tag.trim()).filter(Boolean))]
    .slice(0, 12).map((tag) => tag.slice(0, 50))
  return { source: 'website', title: title.slice(0, 160), summary: summary.slice(0, 300), cover, url: finalUrl, tags, description: summary.slice(0, 2000) }
}
