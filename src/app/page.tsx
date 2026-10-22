import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { ProjectCard } from '@/components/ProjectCard'
import { BlogCard } from '@/components/BlogCard'
import { Footer } from '@/components/Footer'
import { Sparkles, ArrowRight, Layers, LayoutGrid, BookOpenText } from 'lucide-react'

// 服务端动态渲染确保后台新增后立即更新
export const revalidate = 0

export default async function HomePage() {
  const [profile, featuredProjects, categories, totalPublishedCount, latestBlogPosts] = await Promise.all([
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
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        cover: true,
        category: true,
        tags: true,
        readingTime: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
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
                点击作品查看完整介绍，点击图片放大浏览，或通过“在线体验”访问真实项目。
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

        {/* 3. 最新文章 */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-2">
                  <BookOpenText className="h-3.5 w-3.5" strokeWidth={2.2} />
                  <span>Latest notes</span>
                </div>
                <h2 className="text-[24px] font-semibold text-ink sm:text-[28px]">最新思考与手记</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                  从作品的结果走进实现过程，记录技术选择、产品判断与复盘。
                </p>
              </div>
              <Link href="/blog" className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink">
                <span>进入个人博客</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
              </Link>
            </div>

            {latestBlogPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
                {latestBlogPosts.map((post) => <BlogCard key={post.id} post={post} headingLevel={3} />)}
              </div>
            ) : (
              <Link href="/blog" className="group flex min-h-40 flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface px-5 py-10 text-center transition-colors hover:border-ink-3">
                <BookOpenText className="h-6 w-6 text-ink-3" />
                <p className="mt-3 text-[14px] font-medium text-ink">博客已接入，第一篇文章正在整理中</p>
                <span className="mt-1 text-[12.5px] text-ink-2 group-hover:text-ink">查看博客页面 <span aria-hidden>→</span></span>
              </Link>
            )}
          </div>
        </section>

        {/* 4. 分类矩阵 */}
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

        {/* 5. 引流卡片 */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="relative flex flex-col items-center justify-between gap-7 overflow-hidden rounded-panel border border-[#26262d] bg-[#1b1b21] p-8 shadow-panel sm:flex-row sm:p-11 dark:border-line-strong dark:bg-[#151519]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl"
            />
            <div className="relative max-w-xl text-center sm:text-left">
              <h3 className="text-[22px] font-semibold text-white sm:text-[26px]">
                从作品出发，继续阅读背后的思考。
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.75] text-white/60 sm:text-[14.5px]">
                作品库已收录 {totalPublishedCount} 个可公开浏览的项目；博客则用长文记录其中的技术选择、实现过程与复盘。
              </p>
            </div>
            <div className="relative flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/projects" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-btn bg-white px-5 text-[13.5px] font-medium text-[#17171c] shadow-card transition-all hover:bg-white/90 active:scale-[0.98]">
                <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
                <span>浏览作品</span>
              </Link>
              <Link href="/blog" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-btn border border-white/20 px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-white/10">
                <BookOpenText className="h-4 w-4" strokeWidth={2.2} />
                <span>阅读博客</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer profile={safeProfile} />
    </div>
  )
}
