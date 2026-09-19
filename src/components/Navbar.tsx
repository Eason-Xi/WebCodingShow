'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2, Compass, ShieldCheck } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { name: '首页', href: '/' },
    { name: '全部作品', href: '/projects' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / 品牌名 */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 flex items-center justify-center text-white dark:text-neutral-900 shadow-sm transition-transform group-hover:scale-105">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base tracking-tight block">
              WebCoding
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono leading-none block">
              Portfolio
            </span>
          </div>
        </Link>

        {/* 导航菜单 */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                {link.name}
              </Link>
            )
          })}

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1 sm:mx-2" />

          {/* 后台入口 */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="管理控制台"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">后台管理</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
