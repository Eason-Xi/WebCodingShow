'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { normalizeProjectImages, MAX_PROJECT_IMAGES } from '@/lib/project-images'
import { validateImage } from '@/lib/upload-policy'

export function ProjectImagesEditor({ images, onChange, onBusyChange, disabled }: {
  images: string[]
  onChange: (images: string[]) => void
  onBusyChange: (busy: boolean) => void
  disabled: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const locked = disabled || busy
  const button = 'min-h-11 rounded-btn border border-line px-3 py-2 text-xs text-ink-2 hover:bg-subtle disabled:opacity-40'
  function addUrl() {
    try {
      onChange(normalizeProjectImages([...images, url]))
      setUrl('')
      setError('')
    } catch (error) { setError((error as Error).message) }
  }
  async function upload(files: File[]) {
    if (!files.length || locked) return
    setError('')
    if (files.length + images.length > MAX_PROJECT_IMAGES) return setError(`最多添加 ${MAX_PROJECT_IMAGES} 张作品图片`)
    for (const file of files) {
      const error = validateImage(file)
      if (error) return setError(`${file.name}：${error}`)
    }
    setBusy(true)
    onBusyChange(true)
    const uploaded = [...images]
    try {
      for (const file of files) {
        const data = new FormData()
        data.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body: data })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || `${file.name} 上传失败`)
        uploaded.push(result.url)
        onChange(normalizeProjectImages(uploaded))
      }
    } catch (error) {
      setError(`${error instanceof Error ? error.message : '上传失败'}。已成功上传的图片会保留，可重试其余图片。`)
    } finally { setBusy(false); onBusyChange(false) }
  }
  function move(index: number, offset: number) {
    const reordered = [...images]
    ;[reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]]
    onChange(reordered)
  }
  return <section className="space-y-4 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-6">
    <div><h2 className="text-sm font-semibold text-ink">作品图片（{images.length}/{MAX_PROJECT_IMAGES}）</h2><p className="mt-2 text-xs leading-6 text-ink-3">封面会自动放在相册首位。可批量上传 PNG、JPEG、WebP、GIF（每张不超过 4 MB），下方图片按顺序展示，保存后同步到前台。</p></div>
    <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" aria-label="上传多张作品图片" disabled={locked} onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ''; void upload(files) }} />
    <button type="button" className={button} disabled={locked || images.length >= MAX_PROJECT_IMAGES} onClick={() => input.current?.click()}>{busy ? '正在上传图片…' : '批量上传作品图片'}</button>
    <div className="flex flex-col gap-2 sm:flex-row"><input aria-label="添加作品图片链接" type="url" value={url} disabled={locked} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/screenshot.png" className="min-w-0 flex-1 rounded-btn border border-line bg-subtle px-3 py-2 text-sm" /><button type="button" disabled={locked || !url.trim() || images.length >= MAX_PROJECT_IMAGES} onClick={addUrl} className={button}>添加图片链接</button></div>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {!!images.length && <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((src, index) => <li key={src} className="min-w-0 rounded-btn border border-line p-2">
        <Image unoptimized src={src} alt={`作品图片 ${index + 1}`} width={480} height={320} className="aspect-[3/2] w-full rounded-btn bg-subtle object-contain" />
        <div className="mt-2 flex items-center justify-between gap-1"><span className="px-1 text-xs text-ink-3">{index + 1}</span><button type="button" aria-label={`前移第 ${index + 1} 张图片`} disabled={locked || index === 0} onClick={() => move(index, -1)} className={button}>前移</button><button type="button" aria-label={`后移第 ${index + 1} 张图片`} disabled={locked || index === images.length - 1} onClick={() => move(index, 1)} className={button}>后移</button><button type="button" aria-label={`删除第 ${index + 1} 张图片`} disabled={locked} onClick={() => onChange(images.filter((_, i) => i !== index))} className={button}>删除</button></div>
      </li>)}
    </ol>}
  </section>
}
