import { AdminLayoutShell } from './AdminLayoutShell'
import './admin.css'

export const metadata = {
  title: '管理控制台 - WebCoding 作品聚合平台',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
