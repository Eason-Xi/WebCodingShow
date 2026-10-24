import { ListTree } from 'lucide-react'
import type { MarkdownOutlineItem } from '@/lib/markdown-outline'

const LEVEL_INDENT: Record<number, string> = {
  1: 'pl-3',
  2: 'pl-5',
  3: 'pl-7',
  4: 'pl-9',
  5: 'pl-11',
  6: 'pl-12',
}

export function MarkdownOutline({
  items,
  onSelect,
}: {
  items: MarkdownOutlineItem[]
  onSelect: (item: MarkdownOutlineItem) => void
}) {
  return (
    <aside
      aria-label="文章标题目录"
      className="overflow-hidden rounded-btn border border-line bg-subtle lg:sticky lg:top-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-3">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-ink-3" />
          <h3 className="text-xs font-semibold text-ink">文章目录</h3>
        </div>
        <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-3">
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <nav className="max-h-52 overflow-y-auto p-2 lg:max-h-[34rem]" aria-label="Markdown 标题">
          <ol className="space-y-0.5">
            {items.map((item, index) => (
              <li key={`${item.offset}-${index}`}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  title={`第 ${item.line} 行：${item.text}`}
                  className={`group flex min-h-10 w-full items-center gap-2 rounded-btn pr-2 text-left text-xs leading-5 text-ink-2 transition-colors hover:bg-surface hover:text-ink ${LEVEL_INDENT[item.level] || LEVEL_INDENT[6]}`}
                >
                  <span className="shrink-0 font-mono text-[9px] text-ink-4 group-hover:text-ink-3">H{item.level}</span>
                  <span className="line-clamp-2 min-w-0">{item.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <p className="px-4 py-5 text-xs leading-6 text-ink-3">
          添加 <code className="rounded bg-surface px-1 py-0.5 font-mono">#</code>、<code className="rounded bg-surface px-1 py-0.5 font-mono">##</code> 等标题后，这里会自动生成目录。
        </p>
      )}
    </aside>
  )
}
