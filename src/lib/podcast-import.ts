import { prisma } from './prisma'
import { fetchPublicText } from './public-web-fetch'
import { validateProjectUrl } from './project-url'
import { parsePodcastRss } from './podcast-rss'

export async function importPodcast(input: string, db = prisma, readFeed = fetchPublicText) {
  const normalized = validateProjectUrl(input)
  normalized.hash = ''
  const response = await readFeed(normalized.href, { signal: AbortSignal.timeout(25000), headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
  if (response.status !== 200) throw new Error(`RSS 获取失败（HTTP ${response.status}）`)
  const { episodes, feedUrl, ...show } = parsePodcastRss(response.text, response.url)
  // The response URL can be a short-lived, signed CDN URL. Keep the feed's
  // canonical self link (or the submitted URL) for future manual syncs.
  const rssUrl = feedUrl || normalized.href
  let existing = await db.podcast.findFirst({ where: { rssUrl: { in: [rssUrl, normalized.href, response.url] } } })
  if (!existing && new URL(rssUrl).hostname === 'muse.ai') {
    // Recover imports made before we stopped persisting Muse's signed RSS URL.
    existing = await db.podcast.findFirst({ where: {
      rssUrl: { startsWith: 'https://cdn.fbsbx.com/' },
      episodes: { some: { OR: episodes.map(({ guid, audioUrl }) => ({ guid, audioUrl })) } },
    } })
  }
  return db.$transaction(async tx => {
    const podcast = await tx.podcast.upsert({ where: { rssUrl: existing?.rssUrl || rssUrl }, create: { rssUrl, ...show }, update: { rssUrl, ...show, syncedAt: new Date() } })
    let added = 0
    for (const episode of episodes) {
      const where = { podcastId_guid: { podcastId: podcast.id, guid: episode.guid } }
      if (!await tx.podcastEpisode.findUnique({ where, select: { id: true } })) added++
      await tx.podcastEpisode.upsert({ where, create: { podcastId: podcast.id, ...episode }, update: episode })
    }
    return { title: podcast.title, added, total: episodes.length }
  }, { timeout: 30000 })
}
