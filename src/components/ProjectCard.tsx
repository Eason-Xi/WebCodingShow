import React from 'react'
import { ExternalLink, Sparkles, Calendar, Layers } from 'lucide-react'
import { GithubIcon } from './Icons'

export interface ProjectCardData {
  id: string
  title: string
  slug: string
  url: string
  cover?: string | null
  summary: string
  description?: string | null
  category: {
    id: string
    name: string
    slug: string
  }
  tags?: {
    id: string
    name: string
    slug: string
  }[]
  featured?: boolean
  status?: string
  sourceUrl?: string | null
  completedAt?: string | null
}

interface ProjectCardProps {
  project: ProjectCardData
  priority?: boolean
}

export function ProjectCard({ project }: ProjectCardProps) {
  // 默认优雅封面占位图
  const defaultCover =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  const coverUrl = project.cover || defaultCover

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 overflow-hidden">
      {/* 封面图片区 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
        <img
          src={coverUrl}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* 顶部徽章遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* 精选徽章 */}
        {project.featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-white backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>精选代表作</span>
          </div>
        )}

        {/* 分类标签 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white/90 backdrop-blur-md">
          <Layers className="w-3 h-3" />
          <span>{project.category.name}</span>
        </div>

        {/* 年份/时间 */}
        {project.completedAt && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-mono text-white/80 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <Calendar className="w-3 h-3" />
            <span>{project.completedAt}</span>
          </div>
        )}
      </div>

      {/* 内容信息区 */}
      <div className="flex flex-1 flex-col p-5">
        {/* 标题 */}
        <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {project.title}
        </h3>

        {/* 一句话简介 */}
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed flex-1">
          {project.summary}
        </p>

        {/* 标签列表 */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-md text-xs font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800"
              >
                #{tag.name}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="px-1.5 py-0.5 text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                +{project.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* 底部操作区：在线体验 + 源码 */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3">
          {/* 核心行动：在线体验 */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 shadow-xs hover:shadow transition-all active:scale-[0.98]"
          >
            <span>在线体验</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* 源码链接 */}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              title="查看开源代码"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
