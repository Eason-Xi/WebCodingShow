import { prisma } from './prisma'
import { videoWorkUrl, type VideoWork } from './video-works'

export async function getVideoWorks(): Promise<VideoWork[]> {
  const projects = await prisma.project.findMany({
    where: { status: 'published', OR: [{ videoUrl: { not: null } }, { url: { contains: 'bilibili.com' } }, { url: { contains: 'b23.tv' } }] },
    include: { category: true, tags: true },
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
  })
  return projects.flatMap(project => {
    const href = videoWorkUrl(project)
    return href ? [{
      id: project.id, title: project.title, summary: project.summary, cover: project.cover,
      href, category: project.category.name, tags: project.tags.map(tag => tag.name),
      featured: project.featured, completedAt: project.completedAt,
    }] : []
  })
}
