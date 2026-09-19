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
    <div className="min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero 区域 */}
        <Hero profile={safeProfile} totalCount={totalPublishedCount} />

        {/* 2. 精选项目展示区 */}
        <section id="featured" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400 mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Selected Works</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                精选代表作品
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                最具代表性的全栈工程与交互体验，点击“在线体验”直达真实项目。
              </p>
            </div>

            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group"
            >
              <span>查看全部 ({totalPublishedCount})</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
              <p className="text-neutral-500 text-sm">暂无精选项目，请在后台将项目设为“精选”。</p>
            </div>
          )}
        </section>

        {/* 3. 分类矩阵入口 */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-1.5">
              <Layers className="w-4 h-4" />
              <span>Project Matrix</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              按技术领域与形态分类
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              快速筛选感兴趣的专业垂直方向。
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/projects?categoryId=${cat.id}`}
                className="group flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h4>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 block">
                    {cat._count.projects} 个项目
                  </span>
                </div>
                <div className="mt-4 flex justify-end">
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-all group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. 底部引流探索卡片 */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 bg-neutral-900 text-white dark:bg-neutral-900 dark:border dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="max-w-xl text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                想要检索更丰富的项目细节？
              </h3>
              <p className="text-neutral-400 text-sm sm:text-base mt-2">
                进入完整项目作品库，支持毫秒级关键词检索、分类筛选与年份追溯，轻松浏览 500–1000+ 项目。
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-medium text-sm transition-all shadow-md active:scale-95 shrink-0"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>进入完整作品库</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer profile={safeProfile} />
    </div>
  )
}
