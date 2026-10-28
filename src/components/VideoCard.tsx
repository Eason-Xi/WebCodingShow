'use client'

import { useState } from 'react'
import { ArrowUpRight, Film, Play } from 'lucide-react'
import { TrackedProjectLink } from './ContentAnalytics'
import type { VideoWork } from '@/lib/video-works'

export function VideoCard({ work, prominent = false }: { work: VideoWork; prominent?: boolean }) {
  const [failedCover, setFailedCover] = useState<string | null>(null)
  return (
    <article className="group min-w-0">
      <TrackedProjectLink contentId={work.id} event="videoClick" href={work.href} target="_blank" rel="noopener noreferrer"
        aria-label={`${work.title}，前往 B 站观看（新标签页）`}
        className={`block overflow-hidden rounded-panel border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500 ${prominent ? 'border-white/15 bg-[#202125] text-white' : 'border-line bg-surface text-ink'}`}>
        <div className="relative aspect-video overflow-hidden bg-[#24262a]">
          <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,#44403c,transparent_70%)] text-white/20"><Film className="h-20 w-20" strokeWidth={0.8} /></div>
          {work.cover && failedCover !== work.cover && (
            // Bilibili images need a referrer-free request; local uploaded covers work too.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.cover} alt="" width={1280} height={720} loading={prominent ? 'eager' : 'lazy'} referrerPolicy="no-referrer"
              onError={() => setFailedCover(work.cover)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]" />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-medium tracking-widest text-white backdrop-blur-md">BILIBILI</span>
          <span className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-white/60 bg-black/25 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-black"><Play className="ml-1 h-5 w-5" fill="currentColor" strokeWidth={1.5} /></span></span>
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-xs font-medium text-white">前往 B 站观看<ArrowUpRight className="h-4 w-4" /></span>
        </div>
        <div className={prominent ? 'p-5 sm:p-7' : 'p-5'}>
          <div className={`mb-3 flex flex-wrap items-center gap-2 text-[11px] ${prominent ? 'text-amber-200' : 'text-ink-2'}`}><span>{work.category}</span>{work.completedAt && <><span aria-hidden> / </span><span>{work.completedAt}</span></>}</div>
          <h3 className={`line-clamp-2 font-semibold leading-relaxed ${prominent ? 'text-xl sm:text-2xl' : 'text-base'}`}>{work.title}</h3>
          <p className={`mt-3 line-clamp-2 text-[13px] leading-7 ${prominent ? 'text-white/60' : 'text-ink-2'}`}>{work.summary}</p>
          {work.tags.length > 0 && <div className={`mt-4 flex flex-wrap gap-2 text-[10px] ${prominent ? 'text-white/55' : 'text-ink-2'}`}>{work.tags.slice(0, 3).map(tag => <span key={tag} className={`rounded-full px-2.5 py-1 ${prominent ? 'bg-white/5' : 'bg-subtle'}`}>#{tag}</span>)}</div>}
        </div>
      </TrackedProjectLink>
    </article>
  )
}
