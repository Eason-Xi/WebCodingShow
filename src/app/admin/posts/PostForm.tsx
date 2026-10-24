'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { estimateReadingTime, insertMarkdownImage, slugifyBlogTitle } from '@/lib/blog-post'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
  Tags,
  Upload,
  X,
} from 'lucide-react'

const MarkdownPreview = dynamic(
  () => import('./MarkdownPreview').then((module) => module.MarkdownPreview),
  {
    loading: () => (
      <div className="grid min-h-[28rem] place-items-center rounded-btn border border-line bg-subtle text-sm text-ink-3">
        正在加载预览…
      </div>
    ),
  }
)

type PostStatus = 'draft' | 'published'

interface BlogPostRecord {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover?: string | null
  category: string
  tags: string[] | string
  status: PostStatus | string
  featured: boolean
  readingTime: number
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

function slugify(value: string) {
  return value.trim() ? slugifyBlogTitle(value) : ''
}

function normalizeTags(value: BlogPostRecord['tags']): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim()))
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim()))
    }
  } catch {
    // Fall back to comma-separated legacy values.
  }

  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function parseTagsInput(value: string) {
  return [...new Set(
    value
      .split(/[,，\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  )]
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toIsoDate(value: string) {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

interface PostFormSnapshotValues {
  title: string
  slug: string
  excerpt: string
  content: string
  cover: string
  category: string
  tagsInput: string
  featured: boolean
  publishedAt: string
}

function createFormSnapshot(values: PostFormSnapshotValues) {
  return JSON.stringify(values)
}

const EMPTY_FORM_SNAPSHOT = createFormSnapshot({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover: '',
  category: '',
  tagsInput: '',
  featured: false,
  publishedAt: '',
})

export function PostForm({ postId }: { postId?: string }) {
  const router = useRouter()
  const isEdit = Boolean(postId)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const contentImageInputRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const contentImageSelectionRef = useRef({ start: 0, end: 0 })
  const errorRef = useRef<HTMLDivElement>(null)
  const writeTabRef = useRef<HTMLButtonElement>(null)
  const previewTabRef = useRef<HTMLButtonElement>(null)
  const allowNavigationRef = useRef(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [cover, setCover] = useState('')
  const [category, setCategory] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [status, setStatus] = useState<PostStatus>('draft')
  const [featured, setFeatured] = useState(false)
  const [publishedAt, setPublishedAt] = useState('')
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write')
  const [loading, setLoading] = useState(isEdit)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingContentImage, setUploadingContentImage] = useState(false)
  const [submittingStatus, setSubmittingStatus] = useState<PostStatus | null>(null)
  const [imageError, setImageError] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(isEdit ? null : EMPTY_FORM_SNAPSHOT)

  const readingTime = useMemo(() => estimateReadingTime(content), [content])
  const tags = useMemo(() => parseTagsInput(tagsInput), [tagsInput])
  const formSnapshot = useMemo(() => createFormSnapshot({
    title,
    slug,
    excerpt,
    content,
    cover,
    category,
    tagsInput,
    featured,
    publishedAt,
  }), [category, content, cover, excerpt, featured, publishedAt, slug, tagsInput, title])
  const isDirty = savedSnapshot !== null && formSnapshot !== savedSnapshot
  const isUploading = uploadingCover || uploadingContentImage

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    const handleLinkClick = (event: MouseEvent) => {
      if (allowNavigationRef.current || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      event.preventDefault()
      event.stopImmediatePropagation()
      const destination = anchor.href
      if (!window.confirm('这篇文章还有未保存的修改。确定离开并放弃这些修改吗？')) return
      allowNavigationRef.current = true
      window.location.assign(destination)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('click', handleLinkClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('click', handleLinkClick, true)
    }
  }, [isDirty])

  useEffect(() => {
    if (!error) return
    const frame = window.requestAnimationFrame(() => {
      errorRef.current?.focus()
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [error])

  useEffect(() => {
    if (!postId) return

    const controller = new AbortController()

    async function loadPost() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/posts/${postId}`, { signal: controller.signal })
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || '获取文章失败')

        const post: BlogPostRecord = payload?.post ?? payload
        if (!post?.id) throw new Error('文章数据不完整')

        const nextTitle = post.title || ''
        const nextSlug = post.slug || ''
        const nextExcerpt = post.excerpt || ''
        const nextContent = post.content || ''
        const nextCover = post.cover || ''
        const nextCategory = post.category || ''
        const nextTagsInput = normalizeTags(post.tags).join(', ')
        const nextFeatured = Boolean(post.featured)
        const nextPublishedAt = toDateTimeLocal(post.publishedAt)

        setTitle(nextTitle)
        setSlug(nextSlug)
        setSlugEdited(true)
        setExcerpt(nextExcerpt)
        setContent(nextContent)
        setCover(nextCover)
        setCategory(nextCategory)
        setTagsInput(nextTagsInput)
        setStatus(post.status === 'published' ? 'published' : 'draft')
        setFeatured(nextFeatured)
        setPublishedAt(nextPublishedAt)
        setSavedSnapshot(createFormSnapshot({
          title: nextTitle,
          slug: nextSlug,
          excerpt: nextExcerpt,
          content: nextContent,
          cover: nextCover,
          category: nextCategory,
          tagsInput: nextTagsInput,
          featured: nextFeatured,
          publishedAt: nextPublishedAt,
        }))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : '获取文章失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadPost()
    return () => controller.abort()
  }, [postId])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  const selectEditorMode = (mode: 'write' | 'preview', focus = false) => {
    setEditorMode(mode)
    if (focus) {
      window.requestAnimationFrame(() => {
        if (mode === 'write') writeTabRef.current?.focus()
        else previewTabRef.current?.focus()
      })
    }
  }

  const handleEditorTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextMode = event.key === 'Home'
      ? 'write'
      : event.key === 'End'
        ? 'preview'
        : editorMode === 'write' ? 'preview' : 'write'
    selectEditorMode(nextMode, true)
  }

  const uploadImage = async (file: File, fallbackError: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.url) throw new Error(payload?.error || fallbackError)
    return payload.url
  }

  const handleCoverUpload = async (file?: File) => {
    if (!file) return

    setUploadingCover(true)
    setError('')
    setSuccess('')
    setImageError(false)
    try {
      setCover(await uploadImage(file, '上传封面失败'))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '上传封面失败')
    } finally {
      setUploadingCover(false)
      if (coverFileInputRef.current) coverFileInputRef.current.value = ''
    }
  }

  const openContentImagePicker = () => {
    const textarea = contentTextareaRef.current
    contentImageSelectionRef.current = textarea
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : { start: content.length, end: content.length }
    setEditorMode('write')
    contentImageInputRef.current?.click()
  }

  const handleContentImageUpload = async (file?: File) => {
    if (!file) return

    setUploadingContentImage(true)
    setError('')
    setSuccess('')
    try {
      const url = await uploadImage(file, '上传正文图片失败')
      const alt = file.name.replace(/\.[^.]+$/, '').trim() || '文章图片'
      const selection = contentImageSelectionRef.current
      const insertion = insertMarkdownImage(content, url, alt, selection.start, selection.end)
      setContent(insertion.content)
      setEditorMode('write')
      setSuccess('图片已上传并插入正文。')
      window.requestAnimationFrame(() => {
        const textarea = contentTextareaRef.current
        textarea?.focus()
        textarea?.setSelectionRange(insertion.cursor, insertion.cursor)
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '上传正文图片失败')
    } finally {
      setUploadingContentImage(false)
      if (contentImageInputRef.current) contentImageInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const nextStatus: PostStatus = submitter?.value === 'published' ? 'published' : 'draft'

    setError('')
    setSuccess('')

    if (!title.trim() || !slug.trim()) {
      setError('标题和 Slug 为必填项')
      return
    }
    if (nextStatus === 'published' && (!excerpt.trim() || !content.trim())) {
      setError('发布前请补全文章摘要和正文')
      return
    }

    setSubmittingStatus(nextStatus)
    try {
      const payload = {
        title: title.trim(),
        slug: slugify(slug),
        excerpt: excerpt.trim(),
        content,
        cover: cover.trim() || null,
        category: category.trim(),
        tags,
        status: nextStatus,
        featured,
        readingTime,
        publishedAt: nextStatus === 'published' ? toIsoDate(publishedAt) : null,
      }

      const response = await fetch(isEdit ? `/api/posts/${postId}` : '/api/posts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || '保存文章失败')

      setStatus(nextStatus)
      setSavedSnapshot(formSnapshot)
      allowNavigationRef.current = true
      setSuccess(nextStatus === 'published' ? '文章已发布，正在返回列表…' : '草稿已保存，正在返回列表…')
      router.push('/admin/posts')
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存文章失败')
    } finally {
      setSubmittingStatus(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl p-4 sm:p-6 xl:p-10">
        <div className="grid min-h-[24rem] place-items-center rounded-card border border-line bg-surface text-sm text-ink-3 shadow-soft">
          正在读取文章…
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl p-4 sm:p-6 xl:p-10">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/admin/posts"
            aria-label="返回文章列表"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-btn border border-line bg-surface text-ink-3 transition-colors hover:bg-subtle hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink sm:text-2xl">{isEdit ? '编辑博客文章' : '写一篇新文章'}</h1>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-subtle text-ink-3'
              }`}>
                {status === 'published' ? '已发布' : '草稿'}
              </span>
              {isDirty ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  未保存
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-6 text-ink-3">用 Markdown 写作，在发布前随时切换预览检查版式。</p>
          </div>
        </div>

        <button
          type="button"
          aria-pressed={featured}
          onClick={() => setFeatured((current) => !current)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-btn px-4 py-2.5 text-sm font-medium transition-colors ${
            featured
              ? 'bg-amber-500 text-white shadow-soft hover:bg-amber-600'
              : 'border border-line bg-surface text-ink-2 hover:bg-subtle hover:text-ink'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {featured ? '已设为精选' : '设为精选文章'}
        </button>
      </div>

      {error ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="mb-6 flex items-start gap-2 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700 outline-none dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div role="status" className="mb-6 flex items-start gap-2 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <form id="post-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-5 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-6">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <FileText className="h-4 w-4 text-ink-3" />
            <h2 className="text-sm font-semibold text-ink">基础信息</h2>
          </div>

          <div>
            <label htmlFor="post-title" className="mb-1.5 block text-xs font-medium text-ink-2">
              文章标题 <span className="text-red-500">*</span>
            </label>
            <input
              id="post-title"
              type="text"
              required
              maxLength={160}
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="一个清晰、具体、让人想点开的标题"
              className="min-h-11 w-full rounded-btn border border-line-strong bg-subtle px-3.5 py-2.5 text-base font-medium text-ink outline-none transition-colors placeholder:font-normal placeholder:text-ink-4 focus:border-line-strong focus:ring-2 focus:ring-ink/10"
            />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="post-slug" className="block text-xs font-medium text-ink-2">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSlug(slugify(title))
                  setSlugEdited(false)
                }}
                className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs text-ink-3 transition-colors hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                根据标题重新生成
              </button>
            </div>
            <div className="flex min-h-11 items-center rounded-btn border border-line-strong bg-subtle focus-within:ring-2 focus-within:ring-ink/10">
              <span className="shrink-0 pl-3.5 font-mono text-xs text-ink-3">/blog/</span>
              <input
                id="post-slug"
                type="text"
                required
                maxLength={120}
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value)
                  setSlugEdited(true)
                }}
                onBlur={() => setSlug((current) => slugify(current))}
                placeholder="my-post-slug"
                className="min-h-11 min-w-0 flex-1 bg-transparent px-1.5 pr-3.5 font-mono text-sm text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="post-excerpt" className="block text-xs font-medium text-ink-2">文章摘要</label>
              <span className="text-[11px] tabular text-ink-4">{excerpt.length} / 500</span>
            </div>
            <textarea
              id="post-excerpt"
              rows={3}
              maxLength={500}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="用 1–2 句话告诉读者：这篇文章解决什么问题，他能带走什么。"
              className="w-full resize-y rounded-btn border border-line-strong bg-subtle px-3.5 py-3 text-sm leading-7 text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-line-strong focus:ring-2 focus:ring-ink/10"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-ink">Markdown 正文</h2>
              <p className="mt-1 text-xs text-ink-3">支持标题、列表、表格、引用、代码块和图片。</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={contentImageInputRef}
                id="post-content-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => void handleContentImageUpload(event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={isUploading || Boolean(submittingStatus)}
                onClick={openContentImagePicker}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn border border-line bg-surface px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-subtle disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                {uploadingContentImage ? '正在上传…' : '上传并插入图片'}
              </button>
              <div className="grid grid-cols-2 rounded-btn bg-subtle p-1" role="tablist" aria-label="正文编辑模式">
                <button
                  ref={writeTabRef}
                  id="post-write-tab"
                  type="button"
                  role="tab"
                  aria-selected={editorMode === 'write'}
                  aria-controls="post-write-panel"
                  tabIndex={editorMode === 'write' ? 0 : -1}
                  onClick={() => selectEditorMode('write')}
                  onKeyDown={handleEditorTabKeyDown}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-btn px-4 text-sm font-medium transition-colors ${editorMode === 'write' ? 'bg-surface text-ink shadow-soft' : 'text-ink-3 hover:text-ink'}`}
                >
                  <Pencil className="h-4 w-4" />
                  编辑
                </button>
                <button
                  ref={previewTabRef}
                  id="post-preview-tab"
                  type="button"
                  role="tab"
                  aria-selected={editorMode === 'preview'}
                  aria-controls="post-preview-panel"
                  tabIndex={editorMode === 'preview' ? 0 : -1}
                  onClick={() => selectEditorMode('preview')}
                  onKeyDown={handleEditorTabKeyDown}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-btn px-4 text-sm font-medium transition-colors ${editorMode === 'preview' ? 'bg-surface text-ink shadow-soft' : 'text-ink-3 hover:text-ink'}`}
                >
                  <Eye className="h-4 w-4" />
                  预览
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {editorMode === 'write' ? (
              <div id="post-write-panel" role="tabpanel" aria-labelledby="post-write-tab" tabIndex={0}>
                <label htmlFor="post-content" className="sr-only">Markdown 正文</label>
                <textarea
                  ref={contentTextareaRef}
                  id="post-content"
                  rows={22}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  readOnly={uploadingContentImage}
                  aria-busy={uploadingContentImage}
                  spellCheck
                  placeholder={'# 文章开场\n\n从问题、场景或一个具体瞬间开始…\n\n## 第一节\n\n写下你的思考。'}
                  className="min-h-[28rem] w-full resize-y rounded-btn border border-line-strong bg-canvas p-4 font-mono text-sm leading-7 text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-line-strong focus:ring-2 focus:ring-ink/10 sm:p-5"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
                  <span>已输入 {content.length.toLocaleString('zh-CN')} 个字符 · 图片会插入到当前光标位置</span>
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />预计阅读 {readingTime} 分钟</span>
                </div>
              </div>
            ) : (
              <div id="post-preview-panel" role="tabpanel" aria-labelledby="post-preview-tab" tabIndex={0}>
                <MarkdownPreview content={content} />
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <section className="space-y-5 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-6">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <ImageIcon className="h-4 w-4 text-ink-3" />
              <h2 className="text-sm font-semibold text-ink">封面图片</h2>
            </div>

            <div>
              <label htmlFor="post-cover" className="mb-1.5 block text-xs font-medium text-ink-2">图片 URL 或上传本地图片</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="post-cover"
                  type="text"
                  value={cover}
                  onChange={(event) => {
                    setCover(event.target.value)
                    setImageError(false)
                  }}
                  placeholder="https://example.com/cover.jpg"
                  className="min-h-11 min-w-0 flex-1 rounded-btn border border-line-strong bg-subtle px-3.5 py-2.5 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-ink/10"
                />
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void handleCoverUpload(event.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={isUploading || Boolean(submittingStatus)}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-btn border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-subtle disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingCover ? '上传中…' : '上传图片'}
                </button>
              </div>
              <p className="mt-2 text-xs leading-6 text-ink-3">支持 PNG、JPEG、WebP 和 GIF，单张不超过 4 MB。</p>
            </div>

            {cover ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card border border-line bg-subtle">
                {imageError ? (
                  <div className="grid h-full place-items-center p-6 text-center text-sm text-red-600 dark:text-red-400">封面无法加载，请检查图片 URL。</div>
                ) : (
                  <Image
                    unoptimized
                    src={cover}
                    alt="文章封面预览"
                    width={1280}
                    height={720}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  aria-label="移除封面"
                  onClick={() => {
                    setCover('')
                    setImageError(false)
                  }}
                  className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-btn bg-black/70 text-white transition-colors hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
                {uploadingCover ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-medium text-white backdrop-blur-xs">正在上传并保存图片…</div>
                ) : null}
              </div>
            ) : (
              <div className="grid aspect-[16/7] place-items-center rounded-card border border-dashed border-line-strong bg-subtle text-center text-xs text-ink-3">
                <span><ImageIcon className="mx-auto mb-2 h-6 w-6 text-ink-4" />暂未设置文章封面</span>
              </div>
            )}
          </section>

          <section className="space-y-5 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-6">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Tags className="h-4 w-4 text-ink-3" />
              <h2 className="text-sm font-semibold text-ink">分类与发布</h2>
            </div>

            <div>
              <label htmlFor="post-category" className="mb-1.5 block text-xs font-medium text-ink-2">文章分类</label>
              <input
                id="post-category"
                type="text"
                maxLength={80}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="例如：开发手记"
                className="min-h-11 w-full rounded-btn border border-line-strong bg-subtle px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>

            <div>
              <label htmlFor="post-tags" className="mb-1.5 block text-xs font-medium text-ink-2">文章标签</label>
              <input
                id="post-tags"
                type="text"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="Next.js, 产品思考, AI"
                className="min-h-11 w-full rounded-btn border border-line-strong bg-subtle px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/10"
              />
              <p className="mt-2 text-xs leading-6 text-ink-3">使用中文或英文逗号分隔，当前 {tags.length} 个标签。</p>
              {tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => <span key={tag} className="rounded-chip bg-subtle px-2 py-1 text-[11px] text-ink-2">{tag}</span>)}
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="post-published-at" className="mb-1.5 block text-xs font-medium text-ink-2">发布时间</label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="post-published-at"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  className="min-h-11 w-full rounded-btn border border-line-strong bg-subtle py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <p className="mt-2 text-xs leading-6 text-ink-3">留空时，发布文章会使用当前时间。</p>
            </div>

            <div className="rounded-btn bg-subtle p-3.5 text-xs leading-6 text-ink-2">
              <p className="font-medium text-ink">发布前检查</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-3">
                <li>标题和 Slug 准确无误</li>
                <li>摘要适合文章卡片和 SEO</li>
                <li>Markdown 预览中图片与代码块正常</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/posts"
            className="inline-flex min-h-11 items-center justify-center rounded-btn border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-subtle"
          >
            取消并返回
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              name="statusIntent"
              value="draft"
              disabled={Boolean(submittingStatus) || isUploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-subtle disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submittingStatus === 'draft' ? '正在保存草稿…' : '保存为草稿'}
            </button>
            <button
              type="submit"
              name="statusIntent"
              value="published"
              disabled={Boolean(submittingStatus) || isUploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink shadow-card transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {submittingStatus === 'published' ? '正在发布…' : status === 'published' ? '更新已发布文章' : '发布文章'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
