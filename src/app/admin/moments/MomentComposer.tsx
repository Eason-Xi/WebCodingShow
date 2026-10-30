'use client'

/* eslint-disable @next/next/no-img-element -- Clipboard previews use browser object URLs. */
import { useEffect, useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { FileImage, Film, LoaderCircle, Send, X } from 'lucide-react'
import { MAX_MOMENT_LENGTH, MOMENT_ACCEPT, MOMENT_MIME_EXTENSIONS, validateMomentFile, type MomentData, type MomentMedia } from '@/lib/moments'

type Attachment = { id: string; media: MomentMedia; preview: string; progress: number; state: 'uploading' | 'ready' | 'error'; error?: string; file?: File }

function uploadLocal(file: File, progress: (value: number) => void, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const abort = () => xhr.abort()
    signal.addEventListener('abort', abort, { once: true })
    const cleanup = () => signal.removeEventListener('abort', abort)
    xhr.open('POST', '/api/moments/upload')
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)) }
    xhr.onload = () => {
      cleanup()
      try { const data = JSON.parse(xhr.responseText); if (xhr.status >= 400 || !data.url) reject(new Error(data.error || '上传失败')); else resolve(data.url) }
      catch { reject(new Error('上传服务未返回有效响应，请重试')) }
    }
    xhr.onerror = () => { cleanup(); reject(new Error('网络中断，请重新上传')) }
    xhr.onabort = () => { cleanup(); reject(new Error('上传已取消')) }
    const form = new FormData(); form.append('file', file); xhr.send(form)
  })
}

export function MomentComposer({ initial, onSaved, onCancel }: { initial?: MomentData; onSaved: (moment: MomentData) => void; onCancel?: () => void }) {
  const [content, setContent] = useState(initial?.content || '')
  const [attachments, setAttachments] = useState<Attachment[]>(() => initial?.media.map(media => ({ id: crypto.randomUUID(), media, preview: media.url, progress: 100, state: 'ready' })) || [])
  const currentAttachments = useRef(attachments)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const urls = useRef(new Set<string>())
  const controllers = useRef(new Map<string, AbortController>())
  const textarea = useRef<HTMLTextAreaElement>(null)
  const count = Array.from(content.trim()).length
  const uploading = attachments.some(item => item.state === 'uploading')
  const failed = attachments.some(item => item.state === 'error')

  useEffect(() => {
    const objectUrls = urls.current
    const active = controllers.current
    return () => { objectUrls.forEach(url => URL.revokeObjectURL(url)); active.forEach(controller => controller.abort()) }
  }, [])

  function update(next: Attachment[] | ((items: Attachment[]) => Attachment[])) {
    currentAttachments.current = typeof next === 'function' ? next(currentAttachments.current) : next
    setAttachments(currentAttachments.current)
  }

  async function transfer(item: Attachment) {
    const file = item.file!
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    const progress = (value: number) => update(items => items.map(entry => entry.id === item.id ? { ...entry, progress: value } : entry))
    try {
      const configResponse = await fetch('/api/moments/upload', { signal: controller.signal })
      const config = await configResponse.json()
      if (!configResponse.ok) throw new Error(config.error || '请重新登录后上传')
      let url: string
      if (config.storage === 'blob') {
        const blob = await upload(`moments/${crypto.randomUUID()}${MOMENT_MIME_EXTENSIONS[file.type]}`, file, {
          access: 'public', handleUploadUrl: '/api/moments/upload', contentType: file.type,
          multipart: file.size > 4 * 1024 * 1024, clientPayload: JSON.stringify({ type: file.type, size: file.size }),
          onUploadProgress: event => progress(Math.round(event.percentage)), abortSignal: controller.signal,
        })
        url = blob.url
      } else if (config.storage === 'local') url = await uploadLocal(file, progress, controller.signal)
      else throw new Error('线上存储尚未配置，请连接 Vercel Blob')
      update(items => items.map(entry => entry.id === item.id ? { ...entry, media: { ...entry.media, url }, state: 'ready', progress: 100 } : entry))
    } catch (cause) {
      if (!controller.signal.aborted) update(items => items.map(entry => entry.id === item.id ? { ...entry, state: 'error', error: cause instanceof Error ? cause.message : '上传失败' } : entry))
    } finally { controllers.current.delete(item.id) }
  }

  function addFiles(files: File[]) {
    if (saving.current || !files.length) return
    setError('')
    const existing = currentAttachments.current
    const invalid = files.map(validateMomentFile).find(Boolean)
    if (invalid) { setError(invalid); return }
    const types = [...existing.map(item => item.media.type), ...files.map(file => file.type)]
    if (types.length > 4 || (types.some(type => type.startsWith('video/')) && types.length !== 1)) {
      setError('每条动态支持最多 4 张图片或 1 个视频，请分开发送。'); return
    }
    const added: Attachment[] = files.map(file => {
      const preview = URL.createObjectURL(file); urls.current.add(preview)
      return { id: crypto.randomUUID(), media: { url: '', name: file.name.slice(0, 200), size: file.size, type: file.type }, preview, progress: 0, state: 'uploading', file }
    })
    update([...existing, ...added])
    added.forEach(item => { void transfer(item) })
  }

  async function save(status: 'draft' | 'published') {
    if (saving.current || uploading || failed) return
    saving.current = true; setBusy(true); setError('')
    try {
      const response = await fetch(initial ? `/api/moments/${initial.id}` : '/api/moments', {
        method: initial ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, media: currentAttachments.current.map(item => item.media), status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '保存失败')
      if (!initial) { setContent(''); update([]); urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear() }
      onSaved(data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : '保存失败，请重试') }
    finally { saving.current = false; setBusy(false) }
  }

  return <section aria-label={initial ? '编辑动态' : '发布新动态'} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)) }} className={`rounded-panel border bg-surface p-5 shadow-soft transition-colors sm:p-7 ${dragging ? 'border-ink bg-subtle' : 'border-line'}`}>
    <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{initial ? '编辑这一刻' : '有什么新鲜事？'}</h2><span className="text-xs text-ink-3">{initial ? '修改不会更新外部平台内容' : '记录创作，也分享日常'}</span></div>
    <label className="sr-only" htmlFor="moment-content">动态内容</label>
    <textarea ref={textarea} id="moment-content" value={content} disabled={busy} placeholder="一个灵感、一点进展，或是今天想分享的事……" rows={5} onChange={event => setContent(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); if (count <= MAX_MOMENT_LENGTH && (content.trim() || attachments.length)) void save('published') } }} onPaste={event => {
      const files = Array.from(event.clipboardData.items).filter(item => item.kind === 'file').map(item => item.getAsFile()).filter((file): file is File => !!file)
      if (!files.length) return
      event.preventDefault()
      const text = event.clipboardData.getData('text/plain')
      if (text) { const start = event.currentTarget.selectionStart; const end = event.currentTarget.selectionEnd; setContent(value => value.slice(0, start) + text + value.slice(end)) }
      addFiles(files)
    }} className="w-full resize-y border-0 bg-transparent text-base leading-8 text-ink outline-none placeholder:text-ink-3 focus-visible:ring-0 disabled:opacity-60" />
    {dragging && <p className="mb-4 rounded-card border border-dashed border-line-strong p-4 text-center text-sm">松开即可上传图片或视频</p>}
    {attachments.length > 0 && <div className={`mb-5 grid gap-3 ${attachments.length > 1 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}>
      {attachments.map(item => <div key={item.id} className="relative overflow-hidden rounded-card border border-line bg-subtle">
        {item.media.type.startsWith('video/') ? <video src={item.preview} controls playsInline preload="metadata" className="max-h-72 w-full bg-black" /> : <img src={item.preview} alt={item.media.name} className={`w-full object-contain ${attachments.length > 1 ? 'aspect-square' : 'max-h-72'}`} />}
        <button type="button" disabled={busy} aria-label={`移除 ${item.media.name}`} onClick={() => { controllers.current.get(item.id)?.abort(); update(items => items.filter(entry => entry.id !== item.id)); if (urls.current.delete(item.preview)) URL.revokeObjectURL(item.preview) }} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white"><X className="h-4 w-4" /></button>
        <div className="p-2 text-xs"><p className="truncate text-ink-2">{item.media.name}</p>{item.state === 'uploading' && <div className="mt-2"><p role="status" className="text-ink-3">上传中 {item.progress}%</p><progress value={item.progress} max={100} aria-label={`${item.media.name} 上传进度`} className="mt-1 h-1 w-full accent-current" /></div>}{item.state === 'error' && <div role="alert" className="mt-2 text-red-600"><p>{item.error}</p><button type="button" onClick={() => { update(items => items.map(entry => entry.id === item.id ? { ...entry, state: 'uploading', error: undefined, progress: 0 } : entry)); void transfer(item) }} className="mt-1 min-h-9 underline">重新上传</button></div>}{item.state === 'ready' && <p className="mt-1 text-ink-3">已上传 · {(item.media.size / 1024 / 1024).toFixed(1)} MB</p>}</div>
      </div>)}
    </div>}
    {error && <p role="alert" className="mb-4 rounded-btn bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <div className="flex items-center gap-1"><input ref={input} type="file" accept={MOMENT_ACCEPT} multiple disabled={busy} className="hidden" aria-label="选择图片或视频" onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = '' }} /><button type="button" disabled={busy} onClick={() => { if (input.current) { input.current.accept = 'image/jpeg,image/png,image/webp,image/gif'; input.current.multiple = true; input.current.click() } }} className="inline-flex min-h-11 items-center gap-2 rounded-btn px-3 text-sm text-ink-2 hover:bg-subtle"><FileImage className="h-4 w-4" />图片</button><button type="button" disabled={busy} onClick={() => { if (input.current) { input.current.accept = 'video/mp4,video/webm,video/quicktime'; input.current.multiple = false; input.current.click() } }} className="inline-flex min-h-11 items-center gap-2 rounded-btn px-3 text-sm text-ink-2 hover:bg-subtle"><Film className="h-4 w-4" />视频</button></div>
      <div className="flex items-center gap-2"><span className={`mr-1 text-xs tabular-nums ${count > MAX_MOMENT_LENGTH ? 'text-red-600' : 'text-ink-3'}`}>{count} / {MAX_MOMENT_LENGTH}</span>{onCancel && <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-btn px-3 text-sm">取消</button>}<button type="button" disabled={busy || uploading || failed || count > MAX_MOMENT_LENGTH || (!content.trim() && !attachments.length)} onClick={() => void save('draft')} className="min-h-11 rounded-btn border border-line px-3 text-sm disabled:opacity-40">存草稿</button><button type="button" disabled={busy || uploading || failed || count > MAX_MOMENT_LENGTH || (!content.trim() && !attachments.length)} onClick={() => void save('published')} className="inline-flex min-h-11 items-center gap-2 rounded-btn bg-brand px-4 text-sm font-medium text-brand-ink disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{initial?.status === 'published' ? '保存修改' : '发布'}</button></div>
    </div>
    <p className="mt-3 text-xs leading-6 text-ink-3">支持粘贴、拖放上传；最多 4 张图片（单张 4 MB）或 1 个视频（100 MB）。⌘ / Ctrl + Enter 发布。</p>
  </section>
}
