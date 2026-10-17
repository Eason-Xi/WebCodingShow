import { prisma } from '@/lib/prisma'
import { ImportProjectForm } from './ImportProjectForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: '链接导入 - WebCoding' }

export default async function ImportProjectPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return <ImportProjectForm categories={categories} />
}
