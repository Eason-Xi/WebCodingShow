'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 登录页不渲染后台侧边栏
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
