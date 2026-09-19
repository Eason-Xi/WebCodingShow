'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProjectCard, ProjectCardData } from '@/components/ProjectCard'
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  _count?: {
    projects: number
  }
}

export function ProjectsClient() {
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

  const pillClass = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-200 ${
      active
        ? 'bg-brand text-brand-ink shadow-soft'
        : 'bg-subtle text-ink-2 hover:bg-muted hover:text-ink'
    }`

  const fieldClass =
    'rounded-btn border border-line bg-surface text-[13.5px] text-ink transition-colors duration-200 focus:border-line-strong focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink/10'

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      {/* 标题 */}
      <div className="mb-9">
        <h1 className="text-[26px] font-semibold text-ink sm:text-[30px]">完整作品库</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
          汇集所有 Web 编程、AI 工具、实验原型与生产作品，支持多维快速定位与直接体验。
        </p>
      </div>

      {/* 工具栏 */}
      <div className="mb-9 flex flex-col gap-4">
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="搜索项目名称、简介描述或技术标签（如 React, AI, Three.js）..."
              className={`${fieldClass} w-full py-2.5 pl-10 pr-16 placeholder:text-ink-4`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[12px] font-medium text-ink-3 transition-colors duration-200 hover:text-ink"
              >
                清除
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ArrowUpDown className="hidden h-4 w-4 text-ink-3 sm:block" strokeWidth={2} />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              className={`${fieldClass} w-full px-3 py-2.5 sm:w-auto`}
            >
              <option value="featured">精选优先</option>
              <option value="order">排序权重</option>
              <option value="newest">最新完成</option>
              <option value="oldest">最早完成</option>
              <option value="title">字母顺序 (A-Z)</option>
            </select>
          </div>
        </div>

        {/* 分类胶囊 */}
        <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setSelectedCategory('all')
              setPage(1)
            }}
            className={pillClass(selectedCategory === 'all')}
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
              className={pillClass(selectedCategory === cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 统计 */}
        <div className="flex items-center justify-between px-0.5 text-[12.5px] text-ink-3">
          <span>
            检索到{' '}
            <strong className="tabular font-semibold text-ink">{total}</strong> 个项目
            {search && <span className="text-ink-3">（匹配关键词：“{search}”）</span>}
          </span>
          {(search || selectedCategory !== 'all') && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={2.2} />
              <span>重置条件</span>
            </button>
          )}
        </div>
      </div>

      {/* 列表 / 骨架 / 空状态 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="space-y-4 rounded-card border border-line bg-surface p-5"
            >
              <div className="aspect-[16/10] animate-pulse rounded-[10px] bg-subtle" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-subtle" />
              <div className="h-3.5 w-full animate-pulse rounded bg-subtle" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-subtle" />
              <div className="mt-4 h-9 animate-pulse rounded-btn bg-subtle" />
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-line-strong py-20 text-center">
          <SlidersHorizontal className="mx-auto mb-3.5 h-8 w-8 text-ink-4" strokeWidth={1.6} />
          <h3 className="text-[15px] font-semibold text-ink">没有找到匹配的项目</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-3">
            尝试更换搜索关键词，或切换不同的分类标签查看更多作品。
          </p>
          <button
            onClick={handleReset}
            className="mt-5 rounded-btn bg-brand px-4 py-2 text-[13px] font-medium text-brand-ink shadow-soft transition-colors duration-200 hover:bg-brand-hover"
          >
            清除所有筛选条件
          </button>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="上一页"
            className="grid h-9 w-9 place-items-center rounded-btn border border-line text-ink-2 transition-colors duration-200 hover:bg-subtle hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <span className="tabular px-4 text-[12.5px] font-medium text-ink-2">
            第 {page} / {totalPages} 页
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="下一页"
            className="grid h-9 w-9 place-items-center rounded-btn border border-line text-ink-2 transition-colors duration-200 hover:bg-subtle hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  )
}
