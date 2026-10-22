'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { BlogCard, type BlogCardPost } from './BlogCard'
import { readBlogTags } from '@/lib/blog-post'

interface BlogExplorerProps {
  posts: BlogCardPost[]
  initialQuery?: string
  initialCategory?: string
  initialTag?: string
}

export function BlogExplorer({
  posts,
  initialQuery = '',
  initialCategory = 'all',
  initialTag = 'all',
}: BlogExplorerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [tag, setTag] = useState(initialTag)

  const categories = useMemo(
    () => [...new Set(posts.map((post) => post.category).filter((value): value is string => Boolean(value)))],
    [posts],
  )
  const tags = useMemo(
    () => [...new Set(posts.flatMap((post) => readBlogTags(post.tags)))],
    [posts],
  )

  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('zh-CN')
    return posts.filter((post) => {
      const postTags = readBlogTags(post.tags)
      if (category !== 'all' && post.category !== category) return false
      if (tag !== 'all' && !postTags.includes(tag)) return false
      if (!keyword) return true
      return [post.title, post.excerpt, post.category || '', ...postTags]
        .join(' ')
        .toLocaleLowerCase('zh-CN')
        .includes(keyword)
    })
  }, [category, posts, query, tag])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category !== 'all') params.set('category', category)
    if (tag !== 'all') params.set('tag', tag)
    const nextUrl = params.size ? `/blog?${params.toString()}` : '/blog'
    window.history.replaceState(null, '', nextUrl)
  }, [category, query, tag])

  const hasFilters = Boolean(query.trim()) || category !== 'all' || tag !== 'all'
  const resetFilters = () => {
    setQuery('')
    setCategory('all')
    setTag('all')
  }

  return (
    <section aria-labelledby="all-posts-heading" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-2">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Browse notes
            </div>
            <h2 id="all-posts-heading" className="text-[24px] font-semibold text-ink sm:text-[28px]">全部文章</h2>
            <p aria-live="polite" className="mt-2 text-[13.5px] text-ink-2">
              找到 <span className="tabular font-semibold text-ink">{filteredPosts.length}</span> 篇文章
            </p>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-btn px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-subtle hover:text-ink sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              清除筛选
            </button>
          ) : null}
        </div>

        <div className="mb-7 grid grid-cols-1 gap-3 rounded-card border border-line bg-surface p-3 shadow-soft sm:grid-cols-[minmax(0,1fr)_12rem] sm:p-4">
          <label className="relative block">
            <span className="sr-only">搜索博客文章</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、摘要或标签…"
              className="min-h-11 w-full rounded-btn border border-line-strong bg-subtle py-2.5 pl-10 pr-4 text-base text-ink outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-ink/10 sm:text-sm"
            />
          </label>
          <label>
            <span className="sr-only">按文章标签筛选</span>
            <select
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="min-h-11 w-full rounded-btn border border-line-strong bg-subtle px-3 text-base text-ink outline-none focus:ring-2 focus:ring-ink/10 sm:text-sm"
            >
              <option value="all">全部标签</option>
              {tags.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {categories.length > 0 ? (
          <div className="scrollbar-none -mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="文章分类">
            <button
              type="button"
              aria-pressed={category === 'all'}
              onClick={() => setCategory('all')}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors ${category === 'all' ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'}`}
            >
              全部分类
            </button>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors ${category === item ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'}`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-7">
            {filteredPosts.map((post) => <BlogCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-line-strong bg-surface px-5 py-16 text-center">
            <Search className="mx-auto h-7 w-7 text-ink-3" />
            <h3 className="mt-4 text-[16px] font-semibold text-ink">没有找到匹配文章</h3>
            <p className="mt-2 text-[13px] text-ink-2">试试其他关键词，或清除当前筛选。</p>
            <button type="button" onClick={resetFilters} className="mt-5 min-h-11 rounded-btn border border-line-strong px-4 text-[13px] font-medium text-ink-2 hover:bg-subtle hover:text-ink">
              查看全部文章
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
