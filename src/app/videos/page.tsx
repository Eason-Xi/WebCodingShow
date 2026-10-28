import type { Metadata } from 'next'
import { ArrowDown, ArrowUpRight, Film } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { VideoCard } from '@/components/VideoCard'
import { VideoGallery } from '@/components/VideoGallery'
import { getVideoWorks } from '@/lib/video-work-data'
import { prisma } from '@/lib/prisma'

export const revalidate = 0
export const metadata: Metadata = {
  title: '影像创作', description: '用镜头记录灵感，用影像分享创作。浏览影像作品，点击封面前往 B 站观看完整视频。', alternates: { canonical: '/videos' },
}

export default async function VideosPage() {
  const [works, profile] = await Promise.all([getVideoWorks(), prisma.profile.findUnique({ where: { id: 'default' } })])
  const spotlight = works.find(work => work.featured) || works[0]
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1">
    <section className="relative overflow-hidden bg-[#17191b] text-white">
      <div aria-hidden className="pointer-events-none absolute -left-16 bottom-0 select-none font-mono text-[200px] font-bold leading-none tracking-tighter text-white/[0.025] sm:text-[330px]">FRAME</div>
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div><p className="flex items-center gap-2.5 text-[10px] font-medium tracking-[0.23em] text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-200" />WEBCODING / MOTION & STORIES</p>
          <h1 className="mt-8 text-[42px] font-semibold leading-[1.3] sm:text-5xl">让灵感，<br />在画面里发生。</h1>
          <p className="mt-6 max-w-sm text-sm leading-8 text-white/55">从一个想法，到一段影像。<br />记录创作的过程，也收藏值得分享的瞬间。</p>
          <a href="#video-library" className="mt-9 inline-flex min-h-11 items-center gap-5 border-b border-amber-200/50 pb-2 text-sm text-amber-100">探索影像创作<ArrowDown className="h-4 w-4" /></a>
          <div className="mt-12 flex items-center gap-5 border-t border-white/10 pt-5 text-[11px] text-white/45"><span className="font-mono">{String(works.length).padStart(2, '0')} 部影像</span><span className="h-3 w-px bg-white/20" /><span className="inline-flex items-center gap-1.5">点击封面 · B 站观看<ArrowUpRight className="h-3 w-3" /></span></div>
        </div>
        <div>{spotlight ? <><p className="mb-4 flex items-center justify-between text-[10px] tracking-[0.18em] text-white/45"><span>{spotlight.featured ? '精选影像 / IN FOCUS' : '最新影像 / IN FOCUS'}</span><Film className="h-4 w-4" /></p><VideoCard work={spotlight} prominent /></> : <div className="grid aspect-video place-items-center rounded-panel border border-white/15 bg-white/[0.03]"><div className="text-center text-white/40"><Film className="mx-auto mb-4 h-12 w-12" strokeWidth={1} /><p className="text-xs tracking-[0.2em]">下一帧，即将开始</p></div></div>}</div>
      </div>
    </section>
    <div className="mx-auto max-w-6xl px-5 sm:px-8"><VideoGallery works={works} /><div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-3"><span>每一个画面，都是一次表达。</span><span className="inline-flex items-center gap-2"><Film className="h-3.5 w-3.5" />完整视频在 B 站播放</span></div></div>
  </main><Footer profile={profile || undefined} /></div>
}
