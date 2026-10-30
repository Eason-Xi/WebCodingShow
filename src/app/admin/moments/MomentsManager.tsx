'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LoaderCircle, MessageSquareText, Pencil, Pin, Trash2 } from 'lucide-react'
import { MomentCard } from '@/components/MomentCard'
import type { MomentAuthor, MomentData } from '@/lib/moments'
import { MomentComposer } from './MomentComposer'
import { MomentShareDialog } from './MomentShareDialog'

export function MomentsManager({ author }: { author: MomentAuthor }) {
  const [moments, setMoments] = useState<MomentData[]>([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<MomentData>()
  const [sharing, setSharing] = useState<{ moment: MomentData; platform: 'x' | 'xhs' }>()
  const [deleting, setDeleting] = useState<string>()
  const [mutating, setMutating] = useState<string>()
  const mutationLock = useRef(false)
  const [revision, setRevision] = useState(0)
  const composer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true); setError('')
      try {
        const response = await fetch(`/api/moments?status=${filter}&page=${page}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '读取动态失败')
        if (page > 1 && data.pagination.totalPages < page) { setPage(Math.max(1, data.pagination.totalPages)); return }
        setMoments(data.moments); setPages(data.pagination.totalPages); setTotal(data.pagination.total)
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '读取动态失败') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [filter, page, revision])

  function saved(moment: MomentData) {
    const wasEditing = !!editing
    setEditing(undefined); setPage(1); setRevision(value => value + 1)
    setNotice(moment.status === 'draft' ? '草稿已保存，仅自己可见。' : wasEditing ? '动态已更新。外部平台内容请另行修改。' : '发布成功！可以继续同步到 X 或小红书。')
    if (moment.status === 'published') setFilter('all')
    if (moment.status === 'draft') setFilter('draft')
  }

  async function mutate(moment: MomentData, action: 'pin' | 'delete') {
    if (mutationLock.current) return
    mutationLock.current = true; setMutating(moment.id); setError('')
    try {
      const response = await fetch(`/api/moments/${moment.id}`, { method: action === 'delete' ? 'DELETE' : 'PATCH', ...(action === 'pin' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned: !moment.pinned }) } : {}) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '操作失败')
      setDeleting(undefined); setRevision(value => value + 1)
      setNotice(action === 'delete' ? '动态已删除。外部平台的帖子需要单独删除。' : moment.pinned ? '已取消置顶。' : '已置顶。')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '操作失败') }
    finally { mutationLock.current = false; setMutating(undefined) }
  }

  return <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold tracking-[0.16em] text-ink-3">MOMENTS</p><h1 className="text-3xl font-semibold">动态</h1><p className="mt-3 text-sm leading-7 text-ink-2">把灵感、进展与日常，留在自己的时间线里。</p></div><Link href="/moments" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2"><ExternalLink className="h-4 w-4" />查看公开主页</Link></header>
    <div ref={composer}><MomentComposer key={editing?.id || 'new'} initial={editing} onSaved={saved} onCancel={editing ? () => setEditing(undefined) : undefined} /></div>
    {notice && <p role="status" className="mt-4 rounded-card border border-line bg-subtle p-4 text-sm leading-7">{notice}</p>}
    <section className="mt-9" aria-labelledby="moments-list-title"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="moments-list-title" className="text-lg font-semibold">我的动态 <span className="ml-1 text-sm font-normal text-ink-3">{total}</span></h2><div className="flex rounded-btn bg-subtle p-1" aria-label="筛选动态">{[['all', '全部'], ['published', '已发布'], ['draft', '草稿']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); setDeleting(undefined) }} className={`min-h-10 rounded-chip px-4 text-sm ${filter === value ? 'bg-surface text-ink shadow-soft' : 'text-ink-3'}`}>{label}</button>)}</div></div>
      {error && <div role="alert" className="mb-5 rounded-card border border-red-200 p-4 text-sm text-red-600"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-2 min-h-10 underline">重新加载</button></div>}
      {loading ? <p role="status" className="flex justify-center gap-2 py-12 text-sm text-ink-3"><LoaderCircle className="h-4 w-4 animate-spin" />加载动态中…</p> : error ? null : moments.length === 0 ? <div className="rounded-panel border border-dashed border-line-strong p-12 text-center"><MessageSquareText className="mx-auto mb-4 h-8 w-8 text-ink-3" /><p className="text-sm text-ink-2">{filter === 'draft' ? '还没有草稿，灵感可以慢慢写。' : '还没有动态，来分享你的第一刻。'}</p></div> : <div className="space-y-5">{moments.map(moment => <MomentCard key={moment.id} moment={moment} author={author}>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
          {moment.status === 'published' && <><button type="button" onClick={() => setSharing({ moment, platform: 'x' })} className="min-h-10 font-medium text-ink">同步到 X{moment.xUrl ? ' · 已记录' : ' ↗'}</button><button type="button" onClick={() => setSharing({ moment, platform: 'xhs' })} className="min-h-10 font-medium text-rose-600 dark:text-rose-400">同步到小红书{moment.xhsUrl ? ' · 已记录' : ' ↗'}</button></>}
          <span className="flex-1" /><button type="button" disabled={!!mutating} onClick={() => { setEditing(moment); composer.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="inline-flex min-h-10 items-center gap-1"><Pencil className="h-3.5 w-3.5" />{moment.status === 'draft' ? '继续编辑' : '编辑'}</button><button type="button" disabled={!!mutating} onClick={() => void mutate(moment, 'pin')} className="inline-flex min-h-10 items-center gap-1"><Pin className="h-3.5 w-3.5" />{moment.pinned ? '取消置顶' : '置顶'}</button><button type="button" disabled={!!mutating || editing?.id === moment.id} onClick={() => setDeleting(moment.id)} className="inline-flex min-h-10 items-center gap-1 text-red-600"><Trash2 className="h-3.5 w-3.5" />删除</button>
        </div>
        {deleting === moment.id && <div className="w-full rounded-btn bg-subtle p-3"><p className="text-sm">确定删除这条动态？删除后无法恢复。</p><div className="mt-2 flex gap-3"><button type="button" disabled={!!mutating} onClick={() => void mutate(moment, 'delete')} className="min-h-10 text-red-600">{mutating ? '删除中…' : '确认删除'}</button><button type="button" disabled={!!mutating} onClick={() => setDeleting(undefined)} className="min-h-10">取消</button></div></div>}
      </MomentCard>)}</div>}
      {pages > 1 && <nav aria-label="动态分页" className="mt-7 flex items-center justify-center gap-5 text-sm"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="min-h-11 rounded-btn border border-line px-4 disabled:opacity-40">上一页</button><span className="text-ink-3">{page} / {pages}</span><button disabled={page >= pages || loading} onClick={() => setPage(value => value + 1)} className="min-h-11 rounded-btn border border-line px-4 disabled:opacity-40">下一页</button></nav>}
    </section>
    {sharing && <MomentShareDialog key={`${sharing.moment.id}-${sharing.platform}`} moment={sharing.moment} platform={sharing.platform} onClose={() => setSharing(undefined)} onUpdated={() => { setRevision(value => value + 1); setNotice('发布链接已更新。') }} />}
  </div>
}
