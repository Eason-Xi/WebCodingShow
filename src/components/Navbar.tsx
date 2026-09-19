'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2, ShieldCheck, Plus } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { name: '首页', href: '/' },
    { name: '全部作品', href: '/projects' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* 品牌 */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand text-brand-ink shadow-soft transition-transform duration-300 group-hover:scale-[1.05]">
            <Code2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col justify-center leading-none">
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              WebCoding
            </span>
            <span className="mt-[3px] text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Portfolio
            </span>
          </span>
        </Link>

        {/* 导航 */}
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-btn px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-subtle text-ink'
                    : 'text-ink-2 hover:bg-subtle hover:text-ink'
                }`}
              >
                {link.name}
              </Link>
            )
          })}

          <span className="mx-1.5 h-4 w-px bg-line-strong" aria-hidden />

          <Link
            href="/admin/projects/new"
            className="flex shrink-0 items-center gap-1.5 rounded-btn bg-brand px-3 py-2 text-[13px] font-medium text-brand-ink shadow-soft transition-colors duration-200 hover:bg-brand-hover"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="hidden sm:inline">录入新作品</span>
          </Link>

          <Link
            href="/admin"
            title="进入后台仪表盘"
            aria-label="进入后台仪表盘"
            className="grid h-9 w-9 place-items-center rounded-btn text-ink-3 transition-colors duration-200 hover:bg-subtle hover:text-ink"
          >
            <ShieldCheck className="h-[17px] w-[17px]" strokeWidth={1.9} />
          </Link>
        </nav>
      </div>
    </header>
  )
}
