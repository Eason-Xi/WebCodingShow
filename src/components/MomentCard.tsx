'use client'

/* eslint-disable @next/next/no-img-element -- Uploaded media keeps its original aspect ratio. */
import Link from 'next/link'
import { useState } from 'react'
import { Check, Copy, ExternalLink, Pin } from 'lucide-react'
import type { MomentAuthor, MomentData } from '@/lib/moments'

export function MomentCard({ moment, author, children, permalink = true }: {
  moment: MomentData; author: MomentAuthor; children?: React.ReactNode; permalink?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const date = moment.publishedAt || moment.createdAt
  return <article className="min-w-0 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-7">
    <div className="mb-4 flex items-start gap-3">
      {author.avatar ? <img src={author.avatar} alt="" className="h-11 w-11 rounded-full border border-line object-cover" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-subtle text-lg font-semibold">{author.name.slice(0, 1)}</span>}
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{author.name}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3"><time dateTime={date}>{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Taipei' }).format(new Date(date))}</time>{moment.status === 'draft' && <span className="rounded bg-subtle px-1.5 py-0.5 text-ink-2">草稿 · 仅自己可见</span>}{moment.pinned && <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><Pin className="h-3 w-3" />置顶</span>}</div></div>
    </div>
    {moment.content && <p className="whitespace-pre-wrap break-words text-[15px] leading-8 [overflow-wrap:anywhere]">{moment.content}</p>}
    {moment.media.length > 0 && <div className={`mt-4 grid gap-2 overflow-hidden rounded-card ${moment.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {moment.media.map((media, index) => media.type.startsWith('video/')
        ? <div key={media.url}><video src={media.url} controls playsInline preload="metadata" className="max-h-[560px] w-full rounded-card bg-black" /><a href={media.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs text-ink-3">视频无法播放？打开原文件<ExternalLink className="h-3 w-3" /></a></div>
        : <a key={media.url} href={media.url} target="_blank" rel="noopener noreferrer" aria-label={`查看图片 ${index + 1}`} className="block overflow-hidden bg-subtle"><img src={media.url} alt={media.name || `动态图片 ${index + 1}`} loading="lazy" className={`w-full object-cover transition-opacity hover:opacity-90 ${moment.media.length > 1 ? 'aspect-square' : 'max-h-[600px] object-contain'}`} /></a>)}
    </div>}
    {(permalink || children || moment.xUrl || moment.xhsUrl) && <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-xs text-ink-2">
      {permalink && moment.status === 'published' && <><Link href={`/moments/${moment.id}`} className="inline-flex min-h-10 items-center hover:text-ink">查看动态</Link><button type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(`${window.location.origin}/moments/${moment.id}`); setCopied(true); setCopyError(false) }
        catch { setCopyError(true) }
      }} className="inline-flex min-h-10 items-center gap-1.5 hover:text-ink">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? '链接已复制' : '复制链接'}</button></>}
      {moment.xUrl && <a href={moment.xUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1">在 X 查看<ExternalLink className="h-3 w-3" /></a>}
      {moment.xhsUrl && <a href={moment.xhsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1">在小红书查看<ExternalLink className="h-3 w-3" /></a>}
      {children}
      {copyError && <span role="alert" className="basis-full text-red-600">复制失败，请从地址栏复制动态链接。</span>}
    </div>}
  </article>
}
