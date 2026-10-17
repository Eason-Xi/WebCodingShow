import React from 'react'
import Link from 'next/link'
import { ProjectGallery } from './ProjectGallery'
import { projectGallery } from '@/lib/project-images'
import { readProjectVideoUrl } from '@/lib/project-video'
import { ExternalLink, Sparkles, Calendar, Layers, Play } from 'lucide-react'
import { GithubIcon } from './Icons'

export interface ProjectCardData {
  id: string
  title: string
  slug: string
  url: string
  cover?: string | null
  images?: string | null
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
  videoUrl?: string | null
  sourceUrl?: string | null
  completedAt?: string | null
}

interface ProjectCardProps {
  project: ProjectCardData
  priority?: boolean
}

export function ProjectCard({ project }: ProjectCardProps) {
  const videoUrl = readProjectVideoUrl(project.videoUrl)
  const detailUrl = `/projects/${encodeURIComponent(project.id)}`

  return (
    <article className="card-hover group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft hover:-translate-y-1 hover:border-line-strong hover:shadow-lift">
      {/* 封面 */}
      <div className="relative z-10 aspect-[16/10] w-full bg-subtle">
        <ProjectGallery compact images={projectGallery(project.cover, project.images)} title={project.title} />

        {/* 精选徽章 */}
        {project.featured && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-soft backdrop-blur-sm">
            <Sparkles className="h-3 w-3" strokeWidth={2.4} />
            <span>精选代表作</span>
          </div>
        )}

        {/* 分类 */}
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/95 backdrop-blur-sm">
          <Layers className="h-3 w-3" strokeWidth={2.2} />
          <span>{project.category.name}</span>
        </div>

        {/* 完成时间 */}
        {project.completedAt && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 font-mono text-[11px] text-white/85 backdrop-blur-sm">
            <Calendar className="h-3 w-3" strokeWidth={2.2} />
            <span className="tabular">{project.completedAt}</span>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-[16px] font-semibold text-ink transition-colors duration-200 group-hover:text-ink-2">
          <Link href={detailUrl} className="after:absolute after:inset-0 focus-visible:outline-2">{project.title}</Link>
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-[13.5px] leading-[1.72] text-ink-2">
          {project.summary}
        </p>

        {/* 标签 */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag.id}
                className="max-w-full break-words rounded-chip bg-subtle px-2 py-0.5 text-[11.5px] font-medium text-ink-3"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 操作区 */}
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
          <Link href={detailUrl} className="inline-flex h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-btn border border-line-strong px-2 text-sm text-ink-2 transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2">查看详情</Link>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-btn bg-brand px-2 text-sm font-medium text-brand-ink shadow-soft transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span>在线体验</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          </a>

          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" aria-label="观看视频（在新标签页打开）" className={`inline-flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-btn bg-subtle px-2 text-sm text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 ${!project.sourceUrl ? 'col-span-2' : ''}`}>
              <Play className="h-4 w-4 shrink-0" />观看视频
            </a>
          )}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="查看开源代码"
              aria-label="查看开源代码"
              className={`inline-flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-btn bg-subtle px-2 text-sm text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 ${!videoUrl ? 'col-span-2' : ''}`}
            >
              <GithubIcon className="h-4 w-4 shrink-0" />
              <span>查看源码</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
