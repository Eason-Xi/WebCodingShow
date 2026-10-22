'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Edit2,
  Eye,
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'

type PostStatus = 'draft' | 'published'
const POSTS_PAGE_SIZE = 20

interface BlogPostItem {
  id: string
  title: string
  slug: string
  excerpt: string
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

function normalizeTags(value: BlogPostItem['tags']): string[] {
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

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function PostsTable() {
  const [posts, setPosts] = useState<BlogPostItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | PostStatus>('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<BlogPostItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const deleteDialogRef = useRef<HTMLElement>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const deletingRef = useRef(false)
  const deleteDialogOpen = Boolean(deleteTarget)

  useEffect(() => {
    deletingRef.current = deleting
  }, [deleting])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const query = new URLSearchParams({ limit: String(POSTS_PAGE_SIZE), page: String(page) })
        if (search.trim()) query.set('search', search.trim())
        if (status !== 'all') query.set('status', status)

        const response = await fetch(`/api/posts?${query.toString()}`, {
          signal: controller.signal,
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error || '获取文章列表失败')
        }

        const nextPosts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.posts)
            ? payload.posts
            : []
        setPosts(nextPosts)
        const nextPagination = payload?.pagination
        if (nextPagination && typeof nextPagination.total === 'number') {
          const totalPages = Math.max(0, Number(nextPagination.totalPages) || 0)
          setPagination({ total: nextPagination.total, totalPages })
          if (totalPages > 0 && page > totalPages) setPage(totalPages)
        } else {
          setPagination({ total: nextPosts.length, totalPages: nextPosts.length ? 1 : 0 })
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : '获取文章列表失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [page, reloadKey, search, status])

  useEffect(() => {
    if (!deleteDialogOpen) return

    const frame = window.requestAnimationFrame(() => cancelDeleteRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deletingRef.current) {
        event.preventDefault()
        setDeleteTarget(null)
        return
      }
      if (event.key !== 'Tab') return

      const focusable = deleteDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      deleteTriggerRef.current?.focus()
    }
  }, [deleteDialogOpen])

  const visiblePosts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase()

    return posts.filter((post) => {
      if (status !== 'all' && post.status !== status) return false
      if (!keyword) return true

      const haystack = [
        post.title,
        post.slug,
        post.excerpt,
        post.category,
        ...normalizeTags(post.tags),
      ]
        .join(' ')
        .toLocaleLowerCase()
      return haystack.includes(keyword)
    })
  }, [posts, search, status])

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/posts/${deleteTarget.id}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || '删除文章失败')

      setPosts((current) => current.filter((post) => post.id !== deleteTarget.id))
      setPagination((current) => {
        const total = Math.max(0, current.total - 1)
        return { total, totalPages: Math.ceil(total / POSTS_PAGE_SIZE) }
      })
      setDeleteTarget(null)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除文章失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="w-full max-w-6xl p-4 sm:p-6 xl:p-10">
      <div inert={deleteDialogOpen ? true : undefined} aria-hidden={deleteDialogOpen ? true : undefined}>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-3">Blog Studio</p>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">文章管理</h1>
          <p className="mt-1 text-sm text-ink-3">查找、编辑和管理博客文章的发布状态。</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-4 py-2.5 text-sm font-medium text-brand-ink shadow-soft transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          写新文章
        </Link>
      </div>

      {error ? (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="min-h-11 rounded-btn border border-red-200 px-4 text-sm font-medium hover:bg-red-100 dark:border-red-900 dark:hover:bg-red-950"
          >
            重新加载
          </button>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
        <label className="relative block">
          <span className="sr-only">搜索文章</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="搜索标题、Slug、摘要或标签…"
            className="min-h-11 w-full rounded-btn border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-line-strong focus:ring-2 focus:ring-ink/10"
          />
        </label>
        <label>
          <span className="sr-only">按发布状态筛选</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'all' | PostStatus)
              setPage(1)
            }}
            className="min-h-11 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-line-strong focus:ring-2 focus:ring-ink/10"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="admin-responsive-table admin-project-table w-full border-collapse text-left" aria-label="文章列表">
            <thead>
              <tr className="border-b border-line bg-subtle text-xs font-medium text-ink-3">
                <th className="admin-project-identity px-4 py-3.5 sm:px-6">文章</th>
                <th className="px-4 py-3.5">分类</th>
                <th className="px-4 py-3.5">状态</th>
                <th className="px-4 py-3.5">阅读</th>
                <th className="px-4 py-3.5">日期</th>
                <th className="px-4 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-[13.5px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-sm text-ink-3">
                    正在加载文章…
                  </td>
                </tr>
              ) : visiblePosts.length > 0 ? (
                visiblePosts.map((post) => {
                  const tags = normalizeTags(post.tags)
                  return (
                    <tr key={post.id} className="transition-colors [content-visibility:auto] [contain-intrinsic-size:0_88px] hover:bg-subtle">
                      <td className="admin-project-identity px-4 py-4 sm:px-6">
                        <div className="flex min-w-0 items-start gap-3">
                          {post.cover ? (
                            <Image unoptimized src={post.cover} alt="" width={160} height={120} className="h-12 w-16 shrink-0 rounded-btn bg-subtle object-cover" />
                          ) : (
                            <span className="grid h-12 w-16 shrink-0 place-items-center rounded-btn bg-subtle text-ink-4">
                              <FileText className="h-5 w-5" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate font-medium text-ink">{post.title}</p>
                              {post.featured ? <Sparkles aria-label="精选文章" className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
                            </div>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">/blog/{post.slug}</p>
                            {tags.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rounded-chip bg-subtle px-2 py-0.5 text-[10px] text-ink-3">{tag}</span>
                                ))}
                                {tags.length > 3 ? <span className="px-1 text-[10px] text-ink-4">+{tags.length - 3}</span> : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td data-label="分类" className="whitespace-nowrap px-4 py-4 text-ink-2">{post.category || '未分类'}</td>
                      <td data-label="状态" className="whitespace-nowrap px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-subtle text-ink-3'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-ink-4'}`} />
                          {post.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td data-label="阅读" className="whitespace-nowrap px-4 py-4 text-ink-2">{Math.max(1, post.readingTime || 1)} 分钟</td>
                      <td data-label="日期" className="whitespace-nowrap px-4 py-4 text-ink-2">{formatDate(post.publishedAt || post.updatedAt)}</td>
                      <td data-label="操作" className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {post.status === 'published' ? (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              aria-label={`预览《${post.title}》`}
                              title="在新标签页预览"
                              className="grid h-11 w-11 place-items-center rounded-btn text-ink-3 transition-colors hover:bg-subtle hover:text-ink"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          ) : null}
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            aria-label={`编辑《${post.title}》`}
                            title="编辑文章"
                            className="grid h-11 w-11 place-items-center rounded-btn text-ink-3 transition-colors hover:bg-subtle hover:text-ink"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={(event) => {
                              deleteTriggerRef.current = event.currentTarget
                              setDeleteTarget(post)
                            }}
                            aria-label={`删除《${post.title}》`}
                            title="删除文章"
                            className="grid h-11 w-11 place-items-center rounded-btn text-ink-3 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <FileText className="mx-auto mb-3 h-8 w-8 text-ink-4" />
                    <p className="text-sm font-medium text-ink">没有找到文章</p>
                    <p className="mt-1 text-xs text-ink-3">调整搜索条件，或写一篇新文章。</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-ink-3 sm:px-6">
          <span>
            当前显示 <strong className="text-ink">{visiblePosts.length}</strong> 篇，
            共 <strong className="text-ink">{pagination.total}</strong> 篇
          </span>
          {pagination.totalPages > 1 ? (
            <nav className="flex items-center gap-2" aria-label="文章列表分页">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="min-h-11 rounded-btn border border-line px-3 font-medium text-ink-2 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
              >
                上一页
              </button>
              <span aria-live="polite">第 {page} / {pagination.totalPages} 页</span>
              <button
                type="button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                className="min-h-11 rounded-btn border border-line px-3 font-medium text-ink-2 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
              >
                下一页
              </button>
            </nav>
          ) : (
            <span>草稿和已发布文章都可随时继续编辑</span>
          )}
        </div>
      </div>

      </div>

      {deleteTarget ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !deleting) setDeleteTarget(null)
          }}
        >
          <section
            ref={deleteDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-post-title"
            aria-describedby="delete-post-description"
            className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-panel sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <Trash2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 id="delete-post-title" className="text-base font-semibold text-ink">删除这篇文章？</h2>
                <p id="delete-post-description" className="mt-2 break-words text-sm leading-6 text-ink-3">
                  《{deleteTarget.title}》删除后将从博客下架，此操作无法撤销。
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelDeleteRef}
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="min-h-11 rounded-btn border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-subtle disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="min-h-11 rounded-btn bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '正在删除…' : '确认删除'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
