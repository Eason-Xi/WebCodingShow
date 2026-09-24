'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Images } from 'lucide-react'

function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? <span className="grid h-full min-h-32 place-items-center p-6 text-sm text-ink-3">图片暂时无法加载</span> : (
    <Image unoptimized src={src} alt={alt} width={1600} height={1000} onError={() => setFailed(true)} className={className} />
  )
}

export function ProjectGallery({ images, title, compact = false }: { images: string[]; title: string; compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(false)
  useEffect(() => {
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [open])
  const show = (index: number) => {
    setActive(index)
    setZoom(false)
    setOpen(true)
    dialog.current?.showModal()
  }
  const move = (offset: number) => {
    setActive((index) => (index + offset + images.length) % images.length)
    setZoom(false)
  }
  if (!images.length) return <div className="grid aspect-[16/10] place-items-center rounded-card bg-subtle text-4xl text-ink-4">{title.slice(0, 1)}</div>

  return (
    <div className={compact ? 'h-full' : 'space-y-3'}>
      <button type="button" onClick={() => show(0)} aria-label={`放大查看 ${title} 的图片`} className={`group/image relative block w-full overflow-hidden bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? 'h-full' : 'rounded-card border border-line'}`}>
        <GalleryImage key={images[0]} src={images[0]} alt={`${title} 作品图片`} className={compact ? 'h-full w-full object-cover transition-transform group-hover/image:scale-[1.03]' : 'max-h-[600px] w-full object-contain'} />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white"><ZoomIn size={14} />查看大图{images.length > 1 && <><Images size={14} />{images.length}</>}</span>
      </button>
      {!compact && images.length > 1 && <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {images.map((src, index) => <button key={src} type="button" aria-label={`查看第 ${index + 1} 张图片`} onClick={() => show(index)} className="aspect-[4/3] overflow-hidden rounded-btn border border-line bg-subtle hover:border-ink-3">
          <GalleryImage src={src} alt={`${title} 图片 ${index + 1}`} className="h-full w-full object-cover" />
        </button>)}
      </div>}
      <dialog ref={dialog} aria-label={`${title} 图片预览`} onClose={() => { setOpen(false); setZoom(false) }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
      }} className="fixed inset-0 m-auto h-[100dvh] max-h-none w-screen max-w-none bg-black/95 p-3 text-white backdrop:bg-black/80 sm:p-6">
        {open && <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm">{title} · {active + 1} / {images.length}</p>
            <div className="flex shrink-0 gap-2">
              <button type="button" aria-label={zoom ? '适应屏幕' : '放大图片'} onClick={() => setZoom(!zoom)} className="grid h-11 w-11 place-items-center rounded-full bg-white/15">{zoom ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>
              <button autoFocus type="button" aria-label="关闭图片预览" onClick={() => dialog.current?.close()} className="grid h-11 w-11 place-items-center rounded-full bg-white/15"><X size={22} /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}>
            <GalleryImage key={images[active]} src={images[active]} alt={`${title} 图片 ${active + 1}`} className={zoom ? 'w-[180%] max-w-none' : 'h-full w-full object-contain'} />
          </div>
          {images.length > 1 && <div className="flex shrink-0 justify-center gap-4">
            <button type="button" onClick={() => move(-1)} aria-label="上一张图片" className="flex min-h-11 items-center gap-2 rounded-btn bg-white/15 px-4"><ChevronLeft size={20} />上一张</button>
            <button type="button" onClick={() => move(1)} aria-label="下一张图片" className="flex min-h-11 items-center gap-2 rounded-btn bg-white/15 px-4">下一张<ChevronRight size={20} /></button>
          </div>}
        </div>}
      </dialog>
    </div>
  )
}
