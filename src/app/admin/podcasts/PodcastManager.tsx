'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Rss, RefreshCw } from 'lucide-react'
export function PodcastManager({ podcasts }: { podcasts: { id: string; title: string; rssUrl: string; count: number; syncedAt: string }[] }) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function sync(value: string) {
    setBusy(true); setMessage('正在读取 RSS 并同步单集…')
    try {
      const response = await fetch('/api/podcasts/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '导入失败')
      setMessage(`「${data.title}」同步完成，新增 ${data.added} 期，本次读取 ${data.total} 期。`)
      setUrl(''); router.refresh()
    } catch (e) { setMessage(e instanceof Error ? e.message : '同步失败，请重试') }
    finally { setBusy(false) }
  }
  function submit(event: FormEvent) { event.preventDefault(); void sync(url) }
  return <div className="mx-auto max-w-4xl p-5 sm:p-8"><div className="flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">播客管理</h1><Link href="/podcasts" className="text-sm underline">查看前台</Link></div><p className="mt-3 text-sm leading-7 text-ink-2">添加音频播客的 RSS 地址，导入后即在前台公开。再次同步会更新节目资料和已有单集，并添加新单集。</p><form onSubmit={submit} className="mt-7 rounded-panel border border-line bg-surface p-5"><label htmlFor="rss-url" className="flex items-center gap-2 text-sm font-medium"><Rss className="h-4 w-4" />播客 RSS 地址</label><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input id="rss-url" type="url" required maxLength={2048} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/rss.xml" className="min-h-11 min-w-0 flex-1 rounded-btn border border-line bg-canvas px-3 text-sm" /><button disabled={busy} className="min-h-11 rounded-btn bg-brand px-5 text-sm text-brand-ink disabled:opacity-50">{busy ? '正在同步…' : '导入并发布'}</button></div><p role="status" className="mt-3 text-sm text-ink-2">{message}</p></form><div className="mt-8 space-y-4">{podcasts.map(p => <article key={p.id} className="rounded-card border border-line bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">{p.title}</h2><p className="mt-1 text-xs text-ink-2">{p.count} 期 · 上次同步 {new Date(p.syncedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Taipei' })}</p></div><button disabled={busy} onClick={() => void sync(p.rssUrl)} className="inline-flex min-h-11 items-center gap-2 rounded-btn border border-line px-4 text-sm disabled:opacity-50"><RefreshCw className="h-4 w-4" />同步更新</button></div><p className="mt-3 break-all text-xs text-ink-3">{p.rssUrl}</p></article>)}</div></div>
}
