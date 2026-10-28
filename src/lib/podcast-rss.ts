import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { validateProjectUrl } from './project-url'

type XMLNode = Record<string, unknown>
const node = (value: unknown): XMLNode => value && typeof value === 'object' ? value as XMLNode : {}
const text = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : value && typeof value === 'object' && '#text' in value ? text(node(value)['#text']) : ''
const plain = (value: unknown) => text(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const list = (value: unknown): unknown[] => value == null ? [] : Array.isArray(value) ? value : [value]
function url(value: unknown, base: string): string | null {
  try { const input = text(value); return input ? validateProjectUrl(new URL(input, base).href).href : null } catch { return null }
}
export function parseDuration(value: unknown): number | null {
  const parts = text(value).split(':')
  if (!parts.length || parts.length > 3 || parts.some(p => !/^\d+(\.\d+)?$/.test(p))) return null
  const result = Math.round(parts.reduce((total, part) => total * 60 + Number(part), 0))
  return Number.isSafeInteger(result) && result > 0 ? result : null
}
export function parsePodcastRss(xml: string, base: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('不支持包含实体声明的 RSS')
  if (XMLValidator.validate(xml) !== true) throw new Error('RSS XML 格式无效')
  const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false, processEntities: true }).parse(xml)
  const channel = node(node(parsed.rss).channel)
  const title = plain(channel.title)
  if (!title) throw new Error('未找到 RSS 2.0 节目信息，请提供音频播客 RSS 地址')
  const cover = url(node(channel['itunes:image'])['@_href'], base) || url(node(channel.image).url, base)
  const seen = new Set<string>()
  const episodes = list(channel.item).flatMap(value => {
    const item = node(value)
    const enclosure = list(item.enclosure).map(node).find(e => !text(e['@_type']) || /^audio\//i.test(text(e['@_type'])))
    const audioUrl = url(enclosure?.['@_url'], base)
    if (!audioUrl) return []
    const guid = text(item.guid) || audioUrl
    if (seen.has(guid)) return []
    seen.add(guid)
    const date = new Date(text(item.pubDate))
    return [{ guid, title: plain(item.title) || '未命名单集', description: plain(item['content:encoded'] || item.description || item['itunes:summary']), audioUrl, cover: url(node(item['itunes:image'])['@_href'], base) || cover, duration: parseDuration(item['itunes:duration']), publishedAt: Number.isNaN(date.getTime()) ? null : date, website: url(item.link, base) }]
  })
  if (!episodes.length) throw new Error('RSS 中没有可播放的音频单集（需要 audio enclosure）')
  return { title, description: plain(channel.description), author: plain(channel['itunes:author']) || null, cover, website: url(channel.link, base), episodes }
}
