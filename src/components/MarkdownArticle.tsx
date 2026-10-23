import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { readBilibiliVideoEmbed } from '@/lib/bilibili-video'

function MarkdownLink({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const external = typeof href === 'string' && /^https?:\/\//i.test(href)
  return (
    <a
      {...props}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  )
}

function BilibiliVideo({ href }: { href: string }) {
  const video = readBilibiliVideoEmbed(href)
  if (!video) return null

  return (
    <figure className="my-8 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="aspect-video w-full bg-[#111116]">
        <iframe
          src={video.playerUrl}
          title={`哔哩哔哩视频 ${video.videoId}`}
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0"
        />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[13px] text-ink-2">
        <span>哔哩哔哩视频 · 可在本文内直接播放</span>
        <a
          href={video.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline decoration-line-strong decoration-1 underline-offset-4 transition-colors hover:decoration-ink"
        >
          在哔哩哔哩打开
        </a>
      </figcaption>
    </figure>
  )
}

export function MarkdownArticle({ content }: { content: string }) {
  return (
    <div className="min-w-0 text-[16px] leading-[1.95] text-ink-2 sm:text-[17px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ children }) => <h2 className="mb-5 mt-12 scroll-mt-24 text-[28px] font-semibold text-ink sm:text-[32px]">{children}</h2>,
          h2: ({ children }) => <h3 className="mb-4 mt-11 scroll-mt-24 text-[24px] font-semibold text-ink sm:text-[28px]">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-3 mt-9 scroll-mt-24 text-[20px] font-semibold text-ink sm:text-[22px]">{children}</h4>,
          p: ({ node, children }) => {
            const onlyChild = node?.children.length === 1 ? node.children[0] : null
            const href = onlyChild?.type === 'element' && onlyChild.tagName === 'a'
              ? onlyChild.properties.href
              : null
            if (typeof href === 'string' && readBilibiliVideoEmbed(href)) {
              return <BilibiliVideo href={href} />
            }
            return <p className="my-6 break-words">{children}</p>
          },
          a: ({ href, children }) => (
            <MarkdownLink
              href={href}
              className="font-medium text-ink underline decoration-line-strong decoration-1 underline-offset-4 transition-colors hover:decoration-ink"
            >
              {children}
            </MarkdownLink>
          ),
          ul: ({ children }) => <ul className="my-6 list-disc space-y-2 pl-6 marker:text-ink-3">{children}</ul>,
          ol: ({ children }) => <ol className="my-6 list-decimal space-y-2 pl-6 marker:font-mono marker:text-ink-3">{children}</ol>,
          blockquote: ({ children }) => <blockquote className="my-8 rounded-r-card border-l-4 border-line-strong bg-subtle px-5 py-2 text-ink-2">{children}</blockquote>,
          pre: ({ children }) => <pre className="my-8 max-w-full overflow-x-auto rounded-card border border-line bg-[#18181d] p-4 text-[13px] leading-7 text-[#ededf0] shadow-soft sm:p-5">{children}</pre>,
          code: ({ children, className }) => className ? (
            <code className={`${className} font-mono`}>{children}</code>
          ) : (
            <code className="break-words rounded bg-subtle px-1.5 py-0.5 font-mono text-[0.9em] text-ink">{children}</code>
          ),
          img: ({ src, alt }) => (
            <img
              src={typeof src === 'string' ? src : undefined}
              alt={alt || ''}
              loading="lazy"
              className="my-9 max-h-[42rem] w-full rounded-card border border-line bg-subtle object-contain shadow-card"
            />
          ),
          hr: () => <hr className="my-10 border-line" />,
          table: ({ children }) => <div className="my-8 overflow-x-auto rounded-card border border-line"><table className="w-full min-w-[36rem] border-collapse text-left text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-line bg-subtle px-4 py-3 font-semibold text-ink">{children}</th>,
          td: ({ children }) => <td className="border-b border-line px-4 py-3 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
