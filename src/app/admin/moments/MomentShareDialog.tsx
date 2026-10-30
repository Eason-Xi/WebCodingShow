'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react'
import { buildXIntent, momentShareTitle, type MomentData } from '@/lib/moments'

export function MomentShareDialog({ moment, platform, onClose, onUpdated }: {
  moment: MomentData; platform: 'x' | 'xhs'; onClose: () => void; onUpdated: (moment: MomentData) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [text, setText] = useState(moment.content)
  const [title, setTitle] = useState(momentShareTitle(moment.content))
  const [link, setLink] = useState((platform === 'x' ? moment.xUrl : moment.xhsUrl) || '')
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const name = platform === 'x' ? 'X' : '小红书'
  useEffect(() => { dialog.current?.showModal() }, [])

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); setError('') }
    catch { setError('浏览器不允许复制，请选中文案后手动复制。') }
  }

  async function recordLink() {
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/moments/${moment.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [platform === 'x' ? 'xUrl' : 'xhsUrl']: link }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '保存链接失败')
      onUpdated(data); onClose()
    } catch (cause) { setError(cause instanceof Error ? cause.message : '保存链接失败') }
    finally { setBusy(false) }
  }

  const field = 'w-full rounded-btn border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink'
  return <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose() }} aria-labelledby="moment-share-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-panel border border-line bg-surface p-5 text-ink shadow-panel backdrop:bg-black/45 sm:p-7">
    <div className="mb-4 flex items-center justify-between gap-3"><div><p className="mb-1 text-xs text-ink-3">跨平台发布</p><h2 id="moment-share-title" className="text-xl font-semibold">同步到 {name}</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="关闭发布助手" className="grid h-11 w-11 place-items-center rounded-btn hover:bg-subtle"><X className="h-5 w-5" /></button></div>
    <p className="mb-5 rounded-card bg-subtle p-3 text-sm leading-7 text-ink-2">{platform === 'x' ? '文案和动态链接会预填到 X 发布窗口。图片、视频请先下载，再在 X 中添加；最后由你确认发布。' : '复制标题和正文，下载图片或视频，再打开小红书创作平台上传并确认发布。平台页面不会自动填入文案或附件。'}</p>
    {platform === 'xhs' && <div className="mb-4"><label htmlFor="share-title" className="mb-2 block text-sm font-medium">笔记标题</label><input id="share-title" value={title} onChange={event => setTitle(event.target.value)} className={field} /><div className="mt-2 flex items-center justify-between text-xs"><button type="button" onClick={() => void copy(title, '标题')} className="inline-flex min-h-9 items-center gap-1.5 text-ink-2"><Copy className="h-3.5 w-3.5" />复制标题</button><span className={Array.from(title).length > 20 ? 'text-red-600' : 'text-ink-3'}>{Array.from(title).length} / 建议 20 字以内</span></div></div>}
    <label htmlFor="share-content" className="mb-2 block text-sm font-medium">{platform === 'x' ? 'X 文案' : '笔记正文'}</label><textarea id="share-content" rows={5} value={text} onChange={event => setText(event.target.value)} className={`${field} leading-7`} />
    <div className="mb-4 mt-1 flex items-center justify-between gap-3 text-xs"><button type="button" onClick={() => void copy(text, '正文')} className="inline-flex min-h-10 items-center gap-1.5 text-ink-2"><Copy className="h-3.5 w-3.5" />复制正文</button>{copied && <span role="status" className="inline-flex items-center gap-1 text-ink-2"><Check className="h-3 w-3" />{copied}已复制</span>}</div>
    {platform === 'x' && <p className="mb-4 text-xs leading-6 text-ink-3">X 会按账号权限校验字数。较长动态可在这里精简，原动态内容不会改变。</p>}
    {moment.media.length > 0 && <div className="mb-5"><h3 className="mb-2 text-sm font-medium">下载附件</h3><div className="space-y-2">{moment.media.map((media, index) => {
      const download = new URL(media.url, 'https://local.invalid'); download.searchParams.set('download', '1')
      const href = media.url.startsWith('/') ? `${download.pathname}${download.search}` : download.href
      return <a key={media.url} href={href} download target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 rounded-btn border border-line px-3 text-sm hover:bg-subtle"><Download className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{index + 1}. {media.name}</span><span className="shrink-0 text-xs text-ink-3">{(media.size / 1024 / 1024).toFixed(1)} MB</span></a>
    })}</div></div>}
    <a href={platform === 'x' ? buildXIntent(text, typeof window === 'undefined' ? '' : `${window.location.origin}/moments/${moment.id}`) : 'https://creator.xiaohongshu.com/publish/publish'} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-btn bg-brand px-4 text-sm font-medium text-brand-ink"><ExternalLink className="h-4 w-4" />打开 {name} 确认发布</a>
    <div className="mt-6 border-t border-line pt-5"><label htmlFor="social-published-url" className="block text-sm font-medium">发布完成后，记录帖子链接</label><p className="mb-3 mt-2 text-xs leading-6 text-ink-3">打开发布窗口不代表已发布。粘贴实际帖子链接后，动态下方会显示“在 {name} 查看”。修改本站动态不会同步修改外部帖子。</p><input id="social-published-url" type="url" value={link} onChange={event => setLink(event.target.value)} placeholder={platform === 'x' ? 'https://x.com/用户名/status/…' : 'https://www.xiaohongshu.com/explore/…'} className={field} />{error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}<button type="button" disabled={busy} onClick={() => void recordLink()} className="mt-3 min-h-11 rounded-btn border border-line px-4 text-sm disabled:opacity-50">{busy ? '保存中…' : link ? '保存发布链接' : '清除发布链接'}</button></div>
  </dialog>
}
