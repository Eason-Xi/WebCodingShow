import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  FolderKanban,
  CheckCircle2,
  FileEdit,
  Sparkles,
  Layers,
  Plus,
  ExternalLink,
  ArrowRight,
  Clock,
} from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const [
    totalProjects,
    publishedProjects,
    draftProjects,
    featuredProjects,
    totalCategories,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'published' } }),
    prisma.project.count({ where: { status: 'draft' } }),
    prisma.project.count({ where: { featured: true } }),
    prisma.category.count(),
    prisma.project.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: { category: true },
    }),
  ])

  const stats = [
    {
      label: '项目总数',
      value: totalProjects,
      desc: '平台累计记录',
      icon: FolderKanban,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: '已发布',
      value: publishedProjects,
      desc: '前台正常展示',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: '草稿箱',
      value: draftProjects,
      desc: '待完善或暂不展示',
      icon: FileEdit,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: '精选代表作',
      value: featuredProjects,
      desc: '首页重点展示位',
      icon: Sparkles,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
    },
    {
      label: '项目分类',
      value: totalCategories,
      desc: '技术领域形态',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
  ]

  return (
    <div className="p-6 sm:p-10 max-w-6xl w-full">
      {/* 头部标题与快速行动 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            管理概览 Dashboard
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            监控作品集数据指标，快速发布与维护独立 Demo 链接。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>录入新项目</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <span>前台预览</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 指标卡片网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {item.label}
                </span>
                <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {item.value}
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                {item.desc}
              </p>
            </div>
          )
        })}
      </div>

      {/* 最近更新项目列表 */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              最近动态项目
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              最近新增或编辑的作品记录
            </p>
          </div>
          <Link
            href="/admin/projects"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
          >
            <span>进入项目管理</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {project.cover ? (
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5 text-neutral-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {project.title}
                    </h4>
                    {project.featured && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                        精选
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        project.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {project.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <span>{project.category.name}</span>
                    <span>•</span>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-500 truncate max-w-xs"
                    >
                      {project.url}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  编辑
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
