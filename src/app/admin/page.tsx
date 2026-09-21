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
    { label: '项目总数', value: totalProjects, desc: '平台累计记录', icon: FolderKanban },
    { label: '已发布', value: publishedProjects, desc: '前台正常展示', icon: CheckCircle2 },
    { label: '草稿箱', value: draftProjects, desc: '待完善或暂不展示', icon: FileEdit },
    { label: '精选代表作', value: featuredProjects, desc: '首页重点展示位', icon: Sparkles },
    { label: '项目分类', value: totalCategories, desc: '技术领域形态', icon: Layers },
  ]

  return (
    <div className="w-full max-w-6xl p-4 sm:p-6 xl:p-10">
      {/* 头部 */}
      <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[22px] font-semibold text-ink sm:text-[26px]">管理概览</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-2">
            监控作品集数据指标，快速发布与维护独立 Demo 链接。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 rounded-btn bg-brand px-4 py-2.5 text-[13px] font-medium text-brand-ink shadow-soft transition-colors duration-200 hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            <span>录入新项目</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-btn border border-line-strong bg-surface px-3.5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:bg-subtle hover:text-ink"
          >
            <span>前台预览</span>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* 指标卡 */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="rounded-card border border-line bg-surface p-3 sm:p-5 shadow-soft"
            >
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-medium text-ink-3">{item.label}</span>
                <span className="grid h-7 w-7 place-items-center rounded-chip bg-subtle text-ink-3">
                  <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                </span>
              </div>
              <div className="tabular text-[26px] font-semibold leading-none text-ink sm:text-[30px]">
                {item.value}
              </div>
              <p className="mt-2 text-[11.5px] text-ink-4">{item.desc}</p>
            </div>
          )
        })}
      </div>

      {/* 最近动态 */}
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-6">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">最近动态项目</h2>
            <p className="mt-1 text-[12px] text-ink-3">最近新增或编辑的作品记录</p>
          </div>
          <Link
            href="/admin/projects"
            className="group inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
          >
            <span>进入项目管理</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
        </div>

        <div className="divide-y divide-line">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-4 p-4 transition-colors duration-200 hover:bg-subtle sm:px-6"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                {project.cover ? (
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="h-10 w-10 shrink-0 rounded-chip bg-subtle object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-chip bg-subtle">
                    <FolderKanban className="h-[18px] w-[18px] text-ink-4" strokeWidth={1.8} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="w-full sm:w-auto truncate text-[13.5px] font-medium text-ink">
                      {project.title}
                    </h4>
                    {project.featured && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        精选
                      </span>
                    )}
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium ${
                        project.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-subtle text-ink-3'
                      }`}
                    >
                      {project.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-ink-4">
                    <span className="max-w-24 truncate">{project.category.name}</span>
                    <span aria-hidden>·</span>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-xs truncate text-ink-3 transition-colors duration-200 hover:text-ink hover:underline"
                    >
                      {project.url}
                    </a>
                  </div>
                </div>
              </div>

              <Link
                href={`/admin/projects/${project.id}/edit`}
                className="inline-flex min-h-11 items-center shrink-0 rounded-btn border border-line-strong px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:bg-subtle hover:text-ink"
              >
                编辑
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
