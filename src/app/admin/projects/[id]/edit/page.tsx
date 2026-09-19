import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProjectForm } from '../../ProjectForm'

export const metadata = {
  title: '编辑作品 - WebCoding 作品聚合平台',
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tags: true,
      category: true,
    },
  })

  if (!project) {
    notFound()
  }

  return <ProjectForm initialData={project} isEdit={true} />
}
