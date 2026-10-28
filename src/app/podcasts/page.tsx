import type { Metadata } from 'next'
import Link from 'next/link'
import { Headphones, Rss } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PodcastCard } from '@/components/PodcastCard'
import { prisma } from '@/lib/prisma'

export const revalidate = 0
export const metadata: Metadata = { title: '音频播客', description: '收听订阅的播客节目，探索最新单集与创作背后的声音。', alternates: { canonical: '/podcasts' } }
export default async function PodcastsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams
  const [profile, podcasts, episodes] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 'default' } }),
    prisma.podcast.findMany({ include: { _count: { select: { episodes: true } } }, orderBy: { title: 'asc' } }),
    prisma.podcastEpisode.findMany({ where: show ? { podcastId: show } : {}, include: { podcast: true }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] }),
  ])
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 sm:px-8">
    <header className="mb-12"><p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-amber-700 dark:text-amber-400"><Headphones className="h-4 w-4" />WEBCODING PODCAST</p><h1 className="mt-5 text-4xl font-semibold sm:text-5xl">把时间，留给好声音。</h1><p className="mt-5 text-sm leading-7 text-ink-2">发现值得听的节目，随时开始一段新的思考。播放后可以继续浏览，声音会陪你留在这里。</p></header>
    <section aria-labelledby="shows-title"><div className="mb-5 flex items-center justify-between"><h2 id="shows-title" className="text-xl font-semibold">订阅节目</h2><span className="text-xs text-ink-3">{podcasts.length} 档节目</span></div>
      <nav aria-label="按节目筛选" className="mb-10 flex flex-wrap gap-3"><Link href="/podcasts" aria-current={!show ? 'page' : undefined} className={`rounded-card border px-5 py-4 text-sm ${!show ? 'border-ink bg-subtle' : 'border-line'}`}>全部节目</Link>{podcasts.map(p => <Link key={p.id} href={`/podcasts?show=${p.id}`} aria-current={show === p.id ? 'page' : undefined} className={`flex items-center gap-3 rounded-card border px-5 py-4 ${show === p.id ? 'border-ink bg-subtle' : 'border-line bg-surface'}`}><Rss className="h-5 w-5 text-amber-600" /><span className="text-sm font-medium">{p.title}<span className="ml-3 text-xs font-normal text-ink-3">{p._count.episodes} 期</span></span></Link>)}</nav>
    </section>
    <section aria-labelledby="episodes-title"><h2 id="episodes-title" className="mb-5 text-xl font-semibold">最新单集</h2><div className="space-y-4">{episodes.map(e => <PodcastCard key={e.id} episode={e} />)}</div>{episodes.length === 0 && <div className="rounded-panel border border-dashed border-line-strong p-12 text-center"><Headphones className="mx-auto h-8 w-8 text-ink-3" /><p className="mt-4 text-sm text-ink-2">{show ? '这个节目暂时没有单集。' : '第一档节目即将与你见面。'}</p>{show && <Link href="/podcasts" className="mt-4 inline-block text-sm underline">查看全部节目</Link>}</div>}</section>
  </main><Footer profile={profile || undefined} /></div>
}
