'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface ProjectItem {
  id: string
  title: string
  url: string
  cover?: string | null
  categoryId: string
  category: Category
  status: string
  featured: boolean
  sortOrder: number
  updatedAt: string
}

export function ProjectsTable() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // 筛选与搜索
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // 删除确认弹窗状态
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 1. 加载分类
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(console.error)
  }, [])

  // 2. 加载项目列表
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      params.set('page', page.toString())
      params.set('limit', '10')
      params.set('sort', 'order')

      const res = await fetch(`/api/projects?${params.toString()}`)
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (e) {
      console.error('获取项目失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 200)
    return () => clearTimeout(timer)
  }, [search, selectedCategory, selectedStatus, page])

  // 快速切换发布状态
  const toggleStatus = async (item: ProjectItem) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published'
    try {
      // 乐观更新
      setProjects((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p))
      )
      await fetch(`/api/projects/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
    } catch (e) {
      console.error('更新状态失败', e)
      fetchProjects()
    }
  }

  // 快速切换精选
  const toggleFeatured = async (item: ProjectItem) => {
    const nextFeatured = !item.featured
    try {
      // 乐观更新
      setProjects((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, featured: nextFeatured } : p))
      )
      await fetch(`/api/projects/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: nextFeatured }),
      })
    } catch (e) {
      console.error('更新精选失败', e)
      fetchProjects()
    }
  }

  // 执行删除
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      fetchProjects()
    } catch (e) {
      console.error('删除项目失败', e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl w-full">
      {/* 头部与创建按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            项目管理
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            快速检索、上下架、编辑排序权重或删除项目作品。
          </p>
        </div>

        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>录入新项目</span>
        </Link>
      </div>

      {/* 筛选过滤工具条 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="搜索项目名 / URL..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPage(1)
            }}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿箱</option>
          </select>
        </div>
      </div>

      {/* 表格主体 */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">项目</th>
                <th className="py-3.5 px-4">分类</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4">精选</th>
                <th className="py-3.5 px-4">权重</th>
                <th className="py-3.5 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    加载数据中...
                  </td>
                </tr>
              ) : projects.length > 0 ? (
                projects.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    {/* 项目封面与标题 */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {item.cover ? (
                          <img
                            src={item.cover}
                            alt=""
                            className="w-12 h-9 rounded-lg object-cover bg-neutral-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center text-[10px] text-neutral-400">
                            无图
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <p className="font-medium text-neutral-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline truncate max-w-[200px]"
                          >
                            <span>{item.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* 分类 */}
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {item.category?.name || '-'}
                    </td>

                    {/* 状态切换 */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          item.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                        }`}
                        title="点击快速切换发布状态"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'published' ? 'bg-emerald-500' : 'bg-neutral-400'
                          }`}
                        />
                        <span>{item.status === 'published' ? '已发布' : '草稿'}</span>
                      </button>
                    </td>

                    {/* 精选切换 */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleFeatured(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.featured
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                            : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title={item.featured ? '精选中（点击取消）' : '设为精选'}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>

                    {/* 权重 */}
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {item.sortOrder}
                    </td>

                    {/* 操作按钮 */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/admin/projects/${item.id}/edit`}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="编辑完整信息"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="删除项目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 text-sm">
                    未检索到符合条件的项目
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页底栏 */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>
            共 <strong className="text-neutral-800 dark:text-neutral-200">{total}</strong> 条记录
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 删除防误触弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                确认删除此项目？
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                即将删除 <strong className="text-neutral-800 dark:text-neutral-200">“{deleteTarget.title}”</strong>。该操作不可撤销，删除后前台将立即下架。
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
