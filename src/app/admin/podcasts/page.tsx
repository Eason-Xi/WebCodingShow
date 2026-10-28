import { EpisodeAnalytics } from './EpisodeAnalytics'
import { prisma } from '@/lib/prisma'
import { PodcastManager } from './PodcastManager'
export const revalidate = 0
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; page?: string }> }) {
  const query = await searchParams
  const podcasts = await prisma.podcast.findMany({ include: { _count: { select: { episodes: true } } }, orderBy: { syncedAt: 'desc' } })
  return <><PodcastManager podcasts={podcasts.map(p => ({ id: p.id, title: p.title, rssUrl: p.rssUrl, count: p._count.episodes, syncedAt: p.syncedAt.toISOString() }))} /><EpisodeAnalytics query={query} /></>
}
