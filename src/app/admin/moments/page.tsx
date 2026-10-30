import { prisma } from '@/lib/prisma'
import { MomentsManager } from './MomentsManager'

export const metadata = { title: '动态管理' }
export const revalidate = 0

export default async function AdminMomentsPage() {
  const profile = await prisma.profile.findUnique({ where: { id: 'default' } })
  return <MomentsManager author={{ name: profile?.name || 'Web 独立创作者', avatar: profile?.avatar || null }} />
}
