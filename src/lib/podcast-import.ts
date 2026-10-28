import { prisma } from './prisma'
import { fetchPublicText } from './public-web-fetch'
import { validateProjectUrl } from './project-url'
import { parsePodcastRss } from './podcast-rss'

export async function importPodcast(rssUrl: string) {
  const normalized = validateProjectUrl(rssUrl)
  normalized.hash = ''
  const response = await fetchPublicText(normalized.href, { signal: AbortSignal.timeout(25000), headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
  if (response.status !== 200) throw new Error(`RSS 获取失败（HTTP ${response.status}）`)
  const { episodes, ...show } = parsePodcastRss(response.text, response.url)
  const existing = await prisma.podcast.findFirst({ where: { rssUrl: { in: [normalized.href, response.url] } } })
  return prisma.$transaction(async tx => {
    const podcast = await tx.podcast.upsert({ where: { rssUrl: existing?.rssUrl || response.url }, create: { rssUrl: response.url, ...show }, update: { ...show, syncedAt: new Date() } })
    let added = 0
    for (const episode of episodes) {
      const where = { podcastId_guid: { podcastId: podcast.id, guid: episode.guid } }
      if (!await tx.podcastEpisode.findUnique({ where, select: { id: true } })) added++
      await tx.podcastEpisode.upsert({ where, create: { podcastId: podcast.id, ...episode }, update: episode })
    }
    return { title: podcast.title, added, total: episodes.length }
  }, { timeout: 30000 })
}
