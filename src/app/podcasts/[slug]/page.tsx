import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Headphones, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PodcastPlayButton } from '@/components/PodcastPlayer'
import { formatDuration, podcastPath } from '@/lib/podcasts'
export const revalidate = 0
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const episode = await prisma.podcastEpisode.findUnique({ where: { id: slug } })
  return episode ? { title: episode.title, description: episode.description.slice(0, 180), alternates: { canonical: podcastPath(episode.id) } } : { title: '单集未找到' }
}
export default async function EpisodePage({ params }: Props) {
  const { slug } = await params
  const episode = await prisma.podcastEpisode.findUnique({ where: { id: slug }, include: { podcast: true } })
  if (!episode) notFound()
  const profile = await prisma.profile.findUnique({ where: { id: 'default' } })
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8"><Link href="/podcasts" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2"><ArrowLeft className="h-4 w-4" />全部播客</Link><div className="mt-8 flex flex-col gap-7 sm:flex-row"><div className="grid h-40 w-40 shrink-0 place-items-center overflow-hidden rounded-panel bg-amber-600/10 text-amber-700">{episode.cover ? <Image unoptimized width={160} height={160} src={episode.cover} alt={`${episode.podcast.title} 封面`} className="h-full w-full object-cover" /> : <Headphones className="h-16 w-16" strokeWidth={1.2} />}</div><div><Link href={`/podcasts?show=${episode.podcastId}`} className="text-sm text-amber-700 dark:text-amber-400">{episode.podcast.title}</Link><h1 className="mt-3 text-3xl font-semibold leading-snug">{episode.title}</h1><p className="my-5 text-xs text-ink-2">{formatDuration(episode.duration)}{episode.publishedAt && ` · ${episode.publishedAt.toLocaleDateString('zh-CN', { timeZone: 'Asia/Taipei' })}`}</p><PodcastPlayButton episode={{ id: episode.id, title: episode.title, audioUrl: episode.audioUrl, showTitle: episode.podcast.title }} /></div></div><section className="mt-12 border-t border-line pt-8"><h2 className="text-xl font-semibold">本期简介</h2><p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-8 text-ink-2">{episode.description || '这期节目暂未提供简介。'}</p>{episode.website && <a href={episode.website} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center text-sm underline">查看节目原文与来源 ↗</a>}</section></main><Footer profile={profile || undefined} /></div>
}
