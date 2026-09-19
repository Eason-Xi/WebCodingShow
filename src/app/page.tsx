import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { ProjectCard } from '@/components/ProjectCard'
import { Footer } from '@/components/Footer'
import { Sparkles, ArrowRight, Layers, LayoutGrid } from 'lucide-react'

// 服务端动态渲染确保后台新增后立即更新
export const revalidate = 0

export default async function HomePage() {
  const [profile, featuredProjects, categories, totalPublishedCount] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 'default' } }),
    prisma.project.findMany({
      where: {
        status: 'published',
        featured: true,
      },
      include: {
        category: true,
        tags: true,
      },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: 'desc' },
      include: {
        _count: {
          select: {
            projects: {
              where: { status: 'published' },
            },
          },
        },
      },
    }),
    prisma.project.count({
      where: { status: 'published' },
    }),
  ])

  const safeProfile = profile || {
    name: 'Web 独立创作者',
    title: 'Senior Web Engineer & Creative Coder',
    bio: '专注于构建高可用、具美感且充满想象力的现代 Web 与 AI 产品。',
    avatar: null,
    githubUrl: 'https://github.com',
    xUrl: 'https://x.com',
    email: 'creator@example.com',
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero */}
        <Hero profile={safeProfile} totalCount={totalPublishedCount} />

        {/* 2. 精选作品 */}
        <section id="featured" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:px-8">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.3} />
                <span>Selected Works</span>
              </div>
              <h2 className="text-[24px] font-semibold text-ink sm:text-[28px]">
                精选代表作品
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                最具代表性的全栈工程与交互体验，点击“在线体验”直达真实项目。
              </p>
            </div>

            <Link
              href="/projects"
              className="group inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              <span className="tabular">查看全部 ({totalPublishedCount})</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>
          </div>

          {featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-line-strong py-16 text-center">
              <p className="text-[13.5px] text-ink-3">暂无精选项目，请在后台将项目设为“精选”。</p>
            </div>
          )}
        </section>

        {/* 3. 分类矩阵 */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <div className="mb-9">
              <div className="mb-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                <Layers className="h-3.5 w-3.5" strokeWidth={2.3} />
                <span>Project Matrix</span>
              </div>
              <h2 className="text-[24px] font-semibold text-ink">按技术领域与形态分类</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                快速筛选感兴趣的专业垂直方向。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/projects?categoryId=${cat.id}`}
                  className="card-hover group flex flex-col justify-between rounded-card border border-line bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
                >
                  <div>
                    <h4 className="text-[14px] font-semibold text-ink">{cat.name}</h4>
                    <span className="tabular mt-1.5 block text-[12.5px] text-ink-3">
                      {cat._count.projects} 个项目
                    </span>
                  </div>
                  <ArrowRight
                    className="mt-5 h-3.5 w-3.5 self-end text-ink-4 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                    strokeWidth={2.2}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 4. 引流卡片 */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="relative flex flex-col items-center justify-between gap-7 overflow-hidden rounded-panel border border-[#26262d] bg-[#1b1b21] p-8 shadow-panel sm:flex-row sm:p-11 dark:border-line-strong dark:bg-[#151519]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl"
            />
            <div className="relative max-w-xl text-center sm:text-left">
              <h3 className="text-[22px] font-semibold text-white sm:text-[26px]">
                想要检索更丰富的项目细节？
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.75] text-white/60 sm:text-[14.5px]">
                进入完整项目作品库，支持毫秒级关键词检索、分类筛选与年份追溯，轻松浏览 500–1000+ 项目。
              </p>
            </div>
            <Link
              href="/projects"
              className="relative inline-flex shrink-0 items-center gap-2 rounded-btn bg-white px-5 py-2.5 text-[13.5px] font-medium text-[#17171c] shadow-card transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
              <span>进入完整作品库</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer profile={safeProfile} />
    </div>
  )
}
