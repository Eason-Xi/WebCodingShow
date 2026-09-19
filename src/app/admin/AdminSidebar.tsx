'use client'

import Link from 'next/link'
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
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

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
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 min-h-screen">
      {/* 顶部 Brand */}
      <div className="h-16 px-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-neutral-900 dark:text-white">
              WebCoding
            </span>
            <span className="block text-[10px] text-neutral-400 font-mono">
              Admin Console
            </span>
          </div>
        </Link>
        <Link
          href="/"
          target="_blank"
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="在新标签页预览前台站"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 导航项 */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* 底部退出与管理员信息 */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              管理员已登录
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="退出登录"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
