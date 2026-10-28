import { ContentView } from '@/components/ContentAnalytics'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Mail } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { blogPostPath, decodeBlogRouteSlug, readBlogTags } from '@/lib/blog-post'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MarkdownArticle } from '@/components/MarkdownArticle'
import { ArticleOutline } from '@/components/ArticleOutline'
import { BlogCard, type BlogCardPost } from '@/components/BlogCard'
import { extractMarkdownOutline } from '@/lib/markdown-outline'

export const revalidate = 0

type BlogPostPageProps = {
  params: Promise<{ slug: string }>
}

const getPublishedPost = cache(async (routeSlug: string) => prisma.blogPost.findFirst({
  where: { slug: decodeBlogRouteSlug(routeSlug), status: 'published' },
}))

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Taipei',
  }).format(value)
}

function toCardPost(post: {
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

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) return { title: '文章未找到' }

  const publishedAt = post.publishedAt || post.createdAt
  return {
    title: post.title,
    description: post.excerpt,
    keywords: readBlogTags(post.tags),
    alternates: { canonical: blogPostPath(post.slug) },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.cover ? [{ url: post.cover, alt: post.title }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) notFound()

  const [profile, orderedPosts, relatedPosts] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 'default' } }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { id: true, slug: true, title: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.blogPost.findMany({
      where: {
        status: 'published',
        id: { not: post.id },
        ...(post.category ? { category: post.category } : {}),
      },
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
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
  ])

  const currentIndex = orderedPosts.findIndex((item) => item.id === post.id)
  const newerPost = currentIndex > 0 ? orderedPosts[currentIndex - 1] : null
  const olderPost = currentIndex >= 0 && currentIndex < orderedPosts.length - 1 ? orderedPosts[currentIndex + 1] : null
  const publishedAt = post.publishedAt || post.createdAt
  const tags = readBlogTags(post.tags)
  const outline = extractMarkdownOutline(post.content)
  const safeProfile = profile || {
    name: 'Web 独立创作者',
    title: 'Full-Stack Developer & Creative Coder',
    bio: '专注于构建具有美感与实用价值的 Web 与 AI 作品。',
    avatar: null,
    githubUrl: null,
    xUrl: null,
    email: null,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ContentView contentType="post" contentId={post.id} />
      <Navbar />
      <main className="flex-1">
        <article>
          <header className="mx-auto max-w-4xl px-5 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-14">
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-btn text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
              返回博客
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] font-medium text-ink-2">
              {post.category ? <span className="rounded-full bg-subtle px-3 py-1.5">{post.category}</span> : null}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <time dateTime={publishedAt.toISOString()}>{formatDate(publishedAt)}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {Math.max(1, post.readingTime || 1)} 分钟阅读
              </span>
            </div>

            <h1 className="mt-6 text-[34px] font-semibold leading-[1.25] text-ink sm:text-[48px] sm:leading-[1.18]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-[15px] leading-8 text-ink-2 sm:text-[17px]">{post.excerpt}</p>

            {tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2" aria-label="文章标签">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-chip border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          {post.cover ? (
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <div className="aspect-[16/8] overflow-hidden rounded-panel border border-line bg-subtle shadow-card sm:aspect-[16/7]">
                <img src={post.cover} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : null}

          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
            <div className={outline.length > 0 ? 'grid gap-8 lg:grid-cols-[15rem_minmax(0,760px)] lg:items-start lg:justify-center xl:gap-12' : 'mx-auto max-w-[760px]'}>
              {outline.length > 0 ? <ArticleOutline items={outline} /> : null}
              <div className="min-w-0">
                <MarkdownArticle content={post.content} />
              </div>
            </div>
          </div>
        </article>

        <aside className="mx-auto max-w-[760px] px-5 pb-8 sm:px-8" aria-label="文章作者">
          <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 shadow-soft sm:flex-row sm:items-center sm:p-6">
            {safeProfile.avatar ? (
              <img src={safeProfile.avatar} alt={safeProfile.name} className="h-14 w-14 shrink-0 rounded-full border border-line object-cover" />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-lg font-semibold text-brand-ink">
                {safeProfile.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2">Written by</p>
              <h2 className="mt-1 text-[17px] font-semibold text-ink">{safeProfile.name}</h2>
              <p className="mt-1 text-[13px] leading-6 text-ink-2">{safeProfile.bio}</p>
            </div>
            {safeProfile.email ? (
              <a href={`mailto:${safeProfile.email}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-btn border border-line-strong px-4 text-[13px] font-medium text-ink-2 hover:bg-subtle hover:text-ink">
                <Mail className="h-4 w-4" /> 联系我
              </a>
            ) : null}
          </div>
        </aside>

        {(newerPost || olderPost) ? (
          <nav className="mx-auto grid max-w-[760px] grid-cols-1 gap-3 px-5 py-8 sm:grid-cols-2 sm:px-8" aria-label="上下篇文章">
            {olderPost ? (
              <Link href={blogPostPath(olderPost.slug)} className="group rounded-card border border-line bg-surface p-4 shadow-soft transition-colors hover:border-line-strong">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2"><ArrowLeft className="h-3.5 w-3.5" /> 上一篇</span>
                <span className="mt-2 line-clamp-2 block text-[14px] font-medium leading-6 text-ink">{olderPost.title}</span>
              </Link>
            ) : <span />}
            {newerPost ? (
              <Link href={blogPostPath(newerPost.slug)} className="group rounded-card border border-line bg-surface p-4 text-right shadow-soft transition-colors hover:border-line-strong">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">下一篇 <ArrowRight className="h-3.5 w-3.5" /></span>
                <span className="mt-2 line-clamp-2 block text-[14px] font-medium leading-6 text-ink">{newerPost.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}

        {relatedPosts.length > 0 ? (
          <section className="mt-8 border-t border-line" aria-labelledby="related-posts-heading">
            <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
              <h2 id="related-posts-heading" className="mb-7 text-[24px] font-semibold text-ink">继续阅读</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((item) => <BlogCard key={item.id} post={toCardPost(item)} headingLevel={3} />)}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer profile={safeProfile} />
    </div>
  )
}
