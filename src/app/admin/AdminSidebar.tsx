'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Tag,
  User,
  LogOut,
  ExternalLink,
  Code2,
  Menu,
  X,
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  const navItems = [
    { name: '数据看板', href: '/admin', icon: LayoutDashboard },
    { name: '项目管理', href: '/admin/projects', icon: FolderKanban },
    { name: '新增作品', href: '/admin/projects/new', icon: PlusCircle },
    { name: '分类管理', href: '/admin/categories', icon: Tag },
    { name: '个人资料', href: '/admin/profile', icon: User },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (e) {
      console.error('退出失败', e)
    }
  }

  return (
    <aside
      className="sticky top-0 z-30 flex w-full shrink-0 flex-col border-b border-line bg-surface lg:h-dvh lg:w-64 lg:border-r lg:border-b-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      {/* 顶部 Brand */}
      <div className="h-16 shrink-0 px-4 lg:px-6 border-b border-line flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-brand-ink">
            <Code2 className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <span className="block text-[13.5px] font-semibold leading-none text-ink">
              WebCoding
            </span>
            <span className="mt-1 block text-[10px] font-medium uppercase leading-none tracking-[0.11em] text-ink-3">
              Admin Console
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            target="_blank"
            className="grid h-11 w-11 place-items-center rounded-md text-ink-3 hover:text-ink hover:bg-subtle transition-colors"
            aria-label="在新标签页预览前台站"
            title="在新标签页预览前台站"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            ref={menuButton}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            aria-label={menuOpen ? '收起管理菜单' : '展开管理菜单'}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-btn text-ink-2 hover:bg-subtle lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div id="admin-navigation" className={`${menuOpen ? 'flex' : 'hidden'} max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto lg:flex lg:min-h-0 lg:flex-1`}>
        {/* 导航项 */}
        <nav aria-label="后台管理" className="flex-1 px-4 py-3 lg:py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : item.href === '/admin/projects'
                  ? pathname === item.href || /^\/admin\/projects\/[^/]+\/edit$/.test(pathname)
                  : pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-btn px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-brand text-brand-ink shadow-soft'
                    : 'text-ink-2 hover:text-ink hover:bg-subtle'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* 底部退出与管理员信息 */}
        <div className="p-4 border-t border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-ink-2">
                管理员已登录
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-1 px-3 text-xs text-ink-3 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
