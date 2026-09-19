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
    <div className="flex min-h-screen bg-subtle text-ink">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
