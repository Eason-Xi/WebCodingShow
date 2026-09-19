'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProjectCard, ProjectCardData } from '@/components/ProjectCard'
import { Search, SlidersHorizontal, Sparkles, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  _count?: {
    projects: number
  }
}

export function ProjectsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'featured')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // 1. 加载分类列表
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch((err) => console.error('加载分类失败:', err))
  }, [])

  // 2. 加载项目数据
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (selectedCategory && selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      if (sort) params.set('sort', sort)
      params.set('page', page.toString())
      params.set('limit', '12')
      params.set('status', 'published')

      const res = await fetch(`/api/projects?${params.toString()}`)
      const data = await res.json()
      if (data.projects) {
        setProjects(data.projects)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 参数变更触发请求与防抖
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProjects()
    }, 250)

    return () => clearTimeout(handler)
  }, [search, selectedCategory, sort, page])

  // 重置筛选
  const handleReset = () => {
    setSearch('')
    setSelectedCategory('all')
    setSort('featured')
    setPage(1)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* 头部标题区 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          完整作品库
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          汇集所有 Web 编程、AI 工具、实验原型与生产作品，支持多维快速定位与直接体验。
        </p>
      </div>

      {/* 搜索与工具栏 */}
      <div className="flex flex-col gap-4 mb-8">
        {/* 顶部搜索输入框与排序 */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="搜索项目名称、简介描述或技术标签（如 React, AI, Three.js）..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                清除
              </button>
            )}
          </div>

          {/* 排序器 */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            >
              <option value="featured">✨ 精选优先</option>
              <option value="order">📌 排序权重</option>
              <option value="newest">🕒 最新完成</option>
              <option value="oldest">🕰️ 最早完成</option>
              <option value="title">🔤 字母顺序 (A-Z)</option>
            </select>
          </div>
        </div>

        {/* 分类过滤器胶囊按钮组 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('all')
              setPage(1)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            全部作品
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 数量统计与重置 */}
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
          <span>
            检索到 <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{total}</strong> 个项目
            {search && `（匹配关键词：“${search}”）`}
          </span>
          {(search || selectedCategory !== 'all') && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重置条件</span>
            </button>
          )}
        </div>
      </div>

      {/* 项目卡片列表 / 骨架屏 / 空状态 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 animate-pulse"
            >
              <div className="aspect-[16/10] bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md w-3/4" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md w-2/3" />
              <div className="h-9 bg-neutral-200 dark:bg-neutral-800 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
          <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-200">
            没有找到匹配的项目
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            尝试更换搜索关键词，或切换不同的分类标签查看更多作品。
          </p>
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          >
            清除所有筛选条件
          </button>
        </div>
      )}

      {/* 分页控制栏 */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-4 text-xs font-mono text-neutral-600 dark:text-neutral-400">
            第 {page} / {totalPages} 页
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
