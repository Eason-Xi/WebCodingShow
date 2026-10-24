import { ListTree } from 'lucide-react'
import { markdownHeadingId, type MarkdownOutlineItem } from '@/lib/markdown-outline'

const LEVEL_INDENT = [
  'pl-3',
  'pl-6',
  'pl-9',
  'pl-12',
  'pl-14',
  'pl-16',
]

function OutlineLinks({ items }: { items: MarkdownOutlineItem[] }) {
  const firstLevel = Math.min(...items.map((item) => item.level))

  return (
    <ol className="space-y-0.5">
      {items.map((item) => {
        const depth = Math.min(LEVEL_INDENT.length - 1, Math.max(0, item.level - firstLevel))
        return (
          <li key={`${item.line}-${item.offset}`}>
            <a
              href={`#${markdownHeadingId(item.line)}`}
              title={item.text}
              className={`group flex min-h-10 items-center gap-2 rounded-r-btn border-l-2 border-transparent pr-3 text-[12px] leading-5 text-ink-2 transition-colors hover:border-line-strong hover:bg-subtle hover:text-ink ${LEVEL_INDENT[depth]}`}
            >
              <span className="shrink-0 font-mono text-[9px] text-ink-4 transition-colors group-hover:text-ink-3">
                H{item.level}
              </span>
              <span className="line-clamp-2 min-w-0">{item.text}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}

export function ArticleOutline({ items }: { items: MarkdownOutlineItem[] }) {
  return (
    <>
      <details className="group overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold text-ink marker:content-none">
          <span className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-ink-3" />
            文章目录
          </span>
          <span className="rounded-full bg-subtle px-2 py-0.5 font-mono text-[10px] font-normal text-ink-3">
            {items.length}
          </span>
        </summary>
        <nav aria-label="文章目录" className="max-h-80 overflow-y-auto border-t border-line p-2">
          <OutlineLinks items={items} />
        </nav>
      </details>

      <aside className="sticky top-24 hidden self-start lg:block" aria-label="文章目录">
        <div className="mb-3 flex items-center justify-between gap-3 px-3">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-ink-3" />
            <h2 className="text-[12px] font-semibold text-ink">文章目录</h2>
          </div>
          <span className="font-mono text-[10px] text-ink-4">{items.length}</span>
        </div>
        <nav className="max-h-[calc(100vh-9rem)] overflow-y-auto" aria-label="文章标题">
          <OutlineLinks items={items} />
        </nav>
      </aside>
    </>
  )
}
