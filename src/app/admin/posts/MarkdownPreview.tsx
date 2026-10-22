'use client'

import { MarkdownArticle } from '@/components/MarkdownArticle'

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="grid min-h-[28rem] place-items-center rounded-btn border border-dashed border-line-strong bg-subtle p-8 text-center text-sm text-ink-3">
        输入 Markdown 内容后，这里会实时显示文章预览。
      </div>
    )
  }

  return (
    <article className="min-h-[28rem] rounded-btn border border-line bg-canvas px-4 py-6 sm:px-7">
      <MarkdownArticle content={content} />
    </article>
  )
}
