import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Clock3, FileText } from 'lucide-react'
import { blogPostPath, readBlogTags } from '@/lib/blog-post'

export interface BlogCardPost {
  id: string
  title: string
  slug: string
  excerpt: string
  cover?: string | null
  category?: string | null
  tags: string | string[]
  readingTime: number
  publishedAt?: Date | string | null
  createdAt: Date | string
}

function formatPostDate(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '待定'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Taipei',
  }).format(date)
}

export function BlogCard({
  post,
  featured = false,
  headingLevel = 3,
}: {
  post: BlogCardPost
  featured?: boolean
  headingLevel?: 2 | 3 | 4
}) {
  const tags = readBlogTags(post.tags)
  const publishedDate = post.publishedAt || post.createdAt
  const HeadingTag = ({ 2: 'h2', 3: 'h3', 4: 'h4' } as const)[headingLevel]

  return (
    <article
      className={`card-hover group overflow-hidden rounded-card border border-line bg-surface shadow-soft hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card ${
        featured ? 'grid md:grid-cols-[1.08fr_0.92fr]' : 'flex h-full flex-col'
      }`}
    >
      <Link
        href={blogPostPath(post.slug)}
        aria-label={`阅读《${post.title}》`}
        className={`relative block overflow-hidden bg-subtle ${featured ? 'min-h-56 md:min-h-[22rem]' : 'aspect-[16/9]'}`}
      >
        {post.cover ? (
          <img
            src={post.cover}
            alt=""
            loading={featured ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_25%_15%,color-mix(in_srgb,var(--c-ink)_9%,transparent),transparent_42%),linear-gradient(145deg,var(--c-subtle),var(--c-muted))]">
            <span className="grid h-12 w-12 place-items-center rounded-card border border-line bg-surface/80 text-ink-3 shadow-soft backdrop-blur">
              <FileText className="h-5 w-5" strokeWidth={1.8} />
            </span>
          </div>
        )}
      </Link>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8 md:justify-center' : 'p-5 sm:p-6'}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] font-medium text-ink-2">
          {post.category ? (
            <span className="rounded-full bg-subtle px-2.5 py-1 text-ink-2">{post.category}</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={new Date(publishedDate).toISOString()}>{formatPostDate(publishedDate)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            {Math.max(1, post.readingTime || 1)} 分钟阅读
          </span>
        </div>

        <HeadingTag className={`${featured ? 'mt-5 text-[26px] sm:text-[32px]' : 'mt-4 text-[20px] sm:text-[22px]'} font-semibold text-ink`}>
          <Link href={blogPostPath(post.slug)} className="transition-colors hover:text-ink-2">
            {post.title}
          </Link>
        </HeadingTag>
        <p className={`${featured ? 'mt-4 text-[14.5px] leading-8' : 'mt-3 line-clamp-3 text-[13.5px] leading-7'} text-ink-2`}>
          {post.excerpt}
        </p>

        {tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2" aria-label="文章标签">
            {tags.slice(0, featured ? 5 : 3).map((tag) => (
              <span key={tag} className="rounded-chip border border-line bg-canvas px-2.5 py-1 font-mono text-[10.5px] text-ink-2">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <Link
          href={blogPostPath(post.slug)}
          className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-btn text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          <span>阅读全文</span>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  )
}
