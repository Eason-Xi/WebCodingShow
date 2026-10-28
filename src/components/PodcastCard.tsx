import Image from 'next/image'
import Link from 'next/link'
import { Headphones } from 'lucide-react'
import { PodcastPlayButton } from './PodcastPlayer'
import { formatDuration, podcastPath } from '@/lib/podcasts'

type Episode = { id: string; title: string; description: string; audioUrl: string; cover: string | null; duration: number | null; publishedAt: Date | null; podcast: { title: string } }
export function PodcastCard({ episode }: { episode: Episode }) {
  return <article className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 shadow-soft sm:flex-row sm:p-7">
    <Link href={podcastPath(episode.id)} aria-label={`查看 ${episode.title}`} className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-card bg-amber-600/10 text-amber-700">
      {episode.cover ? <Image unoptimized width={160} height={160} src={episode.cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Headphones className="h-12 w-12" strokeWidth={1.3} />}
    </Link>
    <div className="min-w-0 flex-1"><p className="text-xs text-amber-700 dark:text-amber-400">{episode.podcast.title} · {formatDuration(episode.duration)}{episode.publishedAt && ` · ${episode.publishedAt.toLocaleDateString('zh-CN', { timeZone: 'Asia/Taipei' })}`}</p><h3 className="mt-2 text-xl font-semibold"><Link href={podcastPath(episode.id)} className="hover:underline">{episode.title}</Link></h3><p className="mt-2 line-clamp-2 text-sm leading-7 text-ink-2">{episode.description}</p><div className="mt-4 flex flex-wrap items-center gap-4"><PodcastPlayButton episode={{ id: episode.id, title: episode.title, audioUrl: episode.audioUrl, showTitle: episode.podcast.title }} /><Link href={podcastPath(episode.id)} className="inline-flex min-h-11 items-center text-sm text-ink-2">单集详情 →</Link></div></div>
  </article>
}
