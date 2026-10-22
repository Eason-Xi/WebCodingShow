import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpenText, PenLine } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { readBlogTags } from '@/lib/blog-post'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BlogCard, type BlogCardPost } from '@/components/BlogCard'
import { BlogExplorer } from '@/components/BlogExplorer'

export const revalidate = 0

export const metadata: Metadata = {
  title: '个人博客',
  description: '记录项目复盘、技术实践、产品判断与创作过程的个人博客。',
  alternates: { canonical: '/blog' },
}

type BlogPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    tag?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined, fallback = '') {
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] || fallback : fallback
}

function serializePost(post: {
  id: string
  title: string
  slug: string
  excerpt: string
  cover: string | null
  category: string | null
  tags: string
  readingTime: number
  publishedAt: Date | null
  createdAt: Date
}): BlogCardPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover: post.cover,
    category: post.category,
    tags: readBlogTags(post.tags),
    readingTime: post.readingTime,
    publishedAt: post.publishedAt?.toISOString() || null,
    createdAt: post.createdAt.toISOString(),
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const query = await searchParams
  const [profile, posts] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 'default' } }),
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
        featured: true,
        readingTime: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  const publicPosts = posts.map(serializePost)
  const featuredRecord = posts.find((post) => post.featured) || posts[0]
  const featuredPost = featuredRecord ? serializePost(featuredRecord) : undefined
  const remainingPosts = featuredPost
    ? publicPosts.filter((post) => post.id !== featuredPost.id)
    : publicPosts
  const topicCount = new Set(posts.flatMap((post) => [post.category || '', ...readBlogTags(post.tags)]).filter(Boolean)).size
  const safeProfile = profile || {
    name: 'Web 独立创作者',
    githubUrl: null,
    xUrl: null,
    email: null,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <header className="relative overflow-hidden border-b border-line px-5 py-16 sm:px-8 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(122,122,140,0.12),transparent)] blur-2xl" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-2 shadow-soft">
              <BookOpenText className="h-3.5 w-3.5" />
              Personal notes
            </div>
            <h1 className="text-[32px] font-semibold leading-tight text-ink sm:text-[46px]">写下过程，也留下判断。</h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-8 text-ink-2 sm:text-[16px]">
              这里记录项目复盘、技术实践与创作过程，让作品背后的思考也有一个可以持续沉淀的地方。
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2 text-[12.5px] text-ink-2">
              <span className="rounded-full border border-line bg-surface px-3 py-1.5"><strong className="tabular text-ink">{posts.length}</strong> 篇文章</span>
              <span className="rounded-full border border-line bg-surface px-3 py-1.5"><strong className="tabular text-ink">{topicCount}</strong> 个主题</span>
            </div>
          </div>
        </header>

        {featuredPost ? (
          <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16" aria-labelledby="featured-post-heading">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-2">Featured writing</p>
                <h2 id="featured-post-heading" className="text-[24px] font-semibold text-ink sm:text-[28px]">精选文章</h2>
              </div>
              {remainingPosts.length > 0 ? (
                <Link href="#all-posts-heading" className="hidden min-h-11 items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink sm:inline-flex">
                  浏览全部 <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
            <BlogCard post={featuredPost} featured headingLevel={3} />
          </section>
        ) : (
          <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
            <div className="rounded-panel border border-dashed border-line-strong bg-surface px-6 py-16 shadow-soft">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-card bg-subtle text-ink-2">
                <PenLine className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-[21px] font-semibold text-ink">第一篇文章正在整理中</h2>
              <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-7 text-ink-2">
                博客已经接入作品集。在后台保存的草稿不会公开，只有发布后才会出现在这里。
              </p>
              <Link href="/projects" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-btn bg-brand px-5 text-[13.5px] font-medium text-brand-ink hover:bg-brand-hover">
                先浏览作品 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {remainingPosts.length > 0 ? (
          <BlogExplorer
            posts={remainingPosts}
            initialQuery={firstValue(query.q)}
            initialCategory={firstValue(query.category, 'all')}
            initialTag={firstValue(query.tag, 'all')}
          />
        ) : null}
      </main>
      <Footer profile={safeProfile} />
    </div>
  )
}
