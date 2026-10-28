import { createHash } from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import { prisma } from './prisma'
import { ANALYTICS_WINDOW_MS, analyticsDay, analyticsDays, type AnalyticsInput, type ContentType } from './analytics-policy'

const eventFields = {
  view: { counter: 'viewCount', daily: 'views' },
  play: { counter: 'playCount', daily: 'plays' },
  videoClick: { counter: 'videoClickCount', daily: 'videoClicks' },
  experienceClick: { counter: 'experienceClickCount', daily: 'experienceClicks' },
} as const
const tables = { project: 'Project', post: 'BlogPost', episode: 'PodcastEpisode' } as const
class UnavailableContent extends Error {}

export async function recordAnalytics(input: AnalyticsInput, db: PrismaClient = prisma, now = new Date()): Promise<'counted' | 'duplicate' | 'unavailable'> {
  const receiptId = createHash('sha256').update([input.visitorId, input.contentType, input.contentId, input.event].join(':')).digest('hex')
  const { counter, daily } = eventFields[input.event]
  const day = analyticsDay(now)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async tx => {
        // The unique receipt and both increments commit together, including concurrent requests.
        await tx.analyticsReceipt.deleteMany({ where: { expiresAt: { lte: now } } })
        if (await tx.analyticsReceipt.findUnique({ where: { id: receiptId } })) return 'duplicate'
        await tx.analyticsReceipt.create({ data: { id: receiptId, expiresAt: new Date(now.getTime() + ANALYTICS_WINDOW_MS) } })
        // Identifiers come only from the fixed allowlists above. Raw increments deliberately
        // leave editorial updatedAt untouched, so traffic cannot reorder "recently edited".
        const publicOnly = input.contentType === 'episode' ? Prisma.empty : Prisma.sql`AND "status" = 'published'`
        const hasVideo = input.event === 'videoClick' ? Prisma.sql`AND "videoUrl" IS NOT NULL AND "videoUrl" <> ''` : Prisma.empty
        const changed = await tx.$executeRaw(Prisma.sql`UPDATE ${Prisma.raw(`"${tables[input.contentType]}"`)} SET ${Prisma.raw(`"${counter}"`)} = ${Prisma.raw(`"${counter}"`)} + 1 WHERE "id" = ${input.contentId} ${publicOnly} ${hasVideo}`)
        if (!changed) throw new UnavailableContent()
        await tx.contentMetricDay.upsert({
          where: { contentType_contentId_day: { contentType: input.contentType, contentId: input.contentId, day } },
          create: { contentType: input.contentType, contentId: input.contentId, day, [daily]: 1 },
          update: { [daily]: { increment: 1 } },
        })
        return 'counted'
      })
    } catch (error) {
      if (error instanceof UnavailableContent) return 'unavailable'
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // A concurrent first visit may race on either unique key. Retry the whole transaction:
        // an existing receipt becomes a duplicate; a daily-row race still gets counted.
        if (['P2002', 'P2034', 'P1008'].includes(error.code) && attempt < 2) continue
      }
      throw error
    }
  }
  throw new Error('Analytics transaction retries exhausted')
}

export async function todayMetrics(contentType: ContentType, ids: string[]) {
  const rows = await prisma.contentMetricDay.findMany({ where: { contentType, contentId: { in: ids }, day: analyticsDay() } })
  return new Map(rows.map(row => [row.contentId, row]))
}

export async function analyticsOverview() {
  const days = analyticsDays()
  const [totals, daily, projects, posts, episodes] = await Promise.all([
    prisma.contentMetricDay.aggregate({ _sum: { views: true, plays: true, videoClicks: true, experienceClicks: true } }),
    prisma.contentMetricDay.groupBy({ by: ['day'], where: { day: { gte: days[0], lte: days[6] } }, _sum: { views: true, plays: true } }),
    prisma.project.findMany({ take: 5, where: { viewCount: { gt: 0 } }, orderBy: [{ viewCount: 'desc' }, { id: 'asc' }], select: { id: true, title: true, viewCount: true } }),
    prisma.blogPost.findMany({ take: 5, where: { viewCount: { gt: 0 } }, orderBy: [{ viewCount: 'desc' }, { id: 'asc' }], select: { id: true, title: true, viewCount: true } }),
    prisma.podcastEpisode.findMany({ take: 5, where: { playCount: { gt: 0 } }, orderBy: [{ playCount: 'desc' }, { id: 'asc' }], select: { id: true, title: true, playCount: true } }),
  ])
  return {
    totals: totals._sum,
    days: days.map(day => { const row = daily.find(r => r.day === day); return { day, views: row?._sum.views ?? 0, plays: row?._sum.plays ?? 0 } }),
    popular: [
      ...projects.map(p => ({ id: p.id, title: p.title, count: p.viewCount, label: '作品', href: `/admin/projects/${p.id}/edit` })),
      ...posts.map(p => ({ id: p.id, title: p.title, count: p.viewCount, label: '文章', href: `/admin/posts/${p.id}/edit` })),
    ].sort((a, b) => b.count - a.count).slice(0, 5),
    episodes,
  }
}
