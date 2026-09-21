'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 登录页不渲染后台侧边栏
  if (pathname === '/admin/login') {
    return <div className="admin-shell">{children}</div>
  }

  return (
    <div className="admin-shell flex min-h-dvh flex-col bg-subtle text-ink lg:flex-row">
      <AdminSidebar key={pathname} />
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}
