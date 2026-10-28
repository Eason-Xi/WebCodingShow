'use client'

import { useState } from 'react'
import { Film, Search, X } from 'lucide-react'
import type { VideoWork } from '@/lib/video-works'
import { VideoCard } from './VideoCard'

export function VideoGallery({ works }: { works: VideoWork[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const categories = [...new Set(works.map(work => work.category))]
  const needle = query.trim().toLocaleLowerCase()
  const visible = works.filter(work => (!category || work.category === category) && [work.title, work.summary, ...work.tags].join(' ').toLocaleLowerCase().includes(needle))

  return <section id="video-library" aria-labelledby="video-library-heading" className="scroll-mt-24 py-14 sm:py-20">
    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-[10px] font-medium tracking-[0.2em] text-ink-3">THE COLLECTION</p><h2 id="video-library-heading" className="text-2xl font-semibold">全部影像<span className="ml-3 align-middle font-mono text-sm font-normal text-ink-3">{String(works.length).padStart(2, '0')}</span></h2></div>
      <div className="relative w-full sm:w-72"><label htmlFor="video-search" className="sr-only">搜索影像标题、简介或标签</label><Search aria-hidden className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-3" /><input id="video-search" type="search" placeholder="搜索影像、灵感或关键词" value={query} onChange={event => setQuery(event.target.value)} className="h-11 w-full rounded-btn border border-line bg-surface pl-10 pr-10 text-xs" />{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')} className="absolute right-0 top-0 grid h-11 w-10 place-items-center text-ink-2"><X className="h-4 w-4" /></button>}</div>
    </div>
    {categories.length > 1 && <div aria-label="筛选影像分类" className="mb-8 flex flex-wrap gap-2">{['', ...categories].map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-11 rounded-full border px-4 text-xs transition-colors ${category === item ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink-2 hover:bg-subtle'}`}>{item || '全部作品'}</button>)}</div>}
    <p role="status" className="sr-only">找到 {visible.length} 部影像作品</p>
    {visible.length ? <div className="grid gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-3">{visible.map(work => <VideoCard key={work.id} work={work} />)}</div> : <div className="rounded-panel border border-dashed border-line-strong px-6 py-20 text-center"><Film className="mx-auto h-9 w-9 text-ink-3" strokeWidth={1.2} /><h3 className="mt-5 font-medium">{works.length ? '没有找到匹配的影像' : '好故事，正在酝酿。'}</h3><p className="mt-2 text-sm text-ink-2">{works.length ? '换个关键词，发现另一种视角。' : '新的影像作品将在这里与你见面。'}</p>{works.length > 0 && <button type="button" onClick={() => { setQuery(''); setCategory('') }} className="mt-5 min-h-11 rounded-btn border border-line-strong px-5 text-sm">查看全部影像</button>}</div>}
  </section>
}
