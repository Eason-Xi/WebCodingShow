import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { todayMetrics } from '@/lib/analytics'
import { AnalyticsRefresh } from '../AnalyticsRefresh'

export async function EpisodeAnalytics({ query }: { query: { q?: string; sort?: string; page?: string } }) {
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : ''
  const sort = query.sort === 'views' ? 'views' : query.sort === 'newest' ? 'newest' : 'plays'
  const where = q ? { title: { contains: q } } : {}
  const total = await prisma.podcastEpisode.count({ where })
  const pages = Math.max(1, Math.ceil(total / 20))
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.page || '1', 10) || 1))
  const episodes = await prisma.podcastEpisode.findMany({ where, include: { podcast: { select: { title: true } } }, take: 20, skip: (page - 1) * 20, orderBy: sort === 'views' ? [{ viewCount: 'desc' }, { id: 'asc' }] : sort === 'plays' ? [{ playCount: 'desc' }, { id: 'asc' }] : [{ publishedAt: 'desc' }, { id: 'asc' }] })
  const today = await todayMetrics('episode', episodes.map(e => e.id))
  const pageUrl = (value: number) => `/admin/podcasts?${new URLSearchParams({ q, sort, page: String(value) })}`
  return <section className="mx-auto max-w-4xl px-5 pb-10 sm:px-8" aria-labelledby="episode-analytics-heading">
    <div className="flex items-center justify-between gap-3"><h2 id="episode-analytics-heading" className="text-xl font-semibold">单集访问与播放</h2><AnalyticsRefresh /></div>
    <p className="mt-3 text-xs leading-6 text-ink-3">统计站内详情浏览和实际开始播放；不包含其他播客平台的数据。今日按台北时间计算，同一浏览器同类操作 30 分钟内计一次，排除已登录管理员。</p>
    <form className="my-5 flex flex-wrap gap-3"><input name="q" aria-label="搜索单集" defaultValue={q} placeholder="搜索单集标题" className="min-h-11 min-w-0 flex-1 rounded-btn border border-line bg-surface px-3 text-sm" /><select name="sort" aria-label="单集排序" defaultValue={sort} className="min-h-11 rounded-btn border border-line bg-surface px-3 text-sm"><option value="plays">按累计播放量</option><option value="views">按累计浏览量</option><option value="newest">最新发布</option></select><button className="min-h-11 rounded-btn bg-brand px-4 text-sm text-brand-ink">查询</button></form>
    <div className="overflow-hidden rounded-card border border-line bg-surface"><table className="admin-responsive-table admin-project-table w-full text-left text-sm"><thead className="border-b border-line bg-subtle text-xs text-ink-3"><tr><th className="p-4">单集</th><th className="p-4">浏览量</th><th className="p-4">播放量</th></tr></thead><tbody className="divide-y divide-line">{episodes.map(e => <tr key={e.id}><td className="admin-project-identity p-4"><div><Link href={`/podcasts/${e.id}`} className="font-medium hover:underline">{e.title}</Link><p className="mt-1 text-xs text-ink-3">{e.podcast.title}</p></div></td><td data-label="浏览量" className="p-4 tabular-nums"><div>{e.viewCount.toLocaleString()}<p className="mt-1 text-xs text-ink-3">今日 {today.get(e.id)?.views ?? 0}</p></div></td><td data-label="播放量" className="p-4 tabular-nums"><div>{e.playCount.toLocaleString()}<p className="mt-1 text-xs text-ink-3">今日 {today.get(e.id)?.plays ?? 0}</p></div></td></tr>)}{!episodes.length && <tr><td colSpan={3} className="p-8 text-center text-ink-3">暂无符合条件的单集</td></tr>}</tbody></table></div>
    <nav aria-label="单集统计分页" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3"><span>共 {total} 期 · 第 {page} / {pages} 页</span><div className="flex gap-4">{page > 1 && <Link href={pageUrl(page - 1)} className="inline-flex min-h-11 items-center underline">上一页</Link>}{page < pages && <Link href={pageUrl(page + 1)} className="inline-flex min-h-11 items-center underline">下一页</Link>}</div></nav>
  </section>
}
