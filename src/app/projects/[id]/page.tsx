import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { ArrowLeft, ExternalLink, Calendar, GitBranch } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { projectGallery } from '@/lib/project-images'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProjectGallery } from '@/components/ProjectGallery'

export const revalidate = 0
const getProject = cache((id: string) => prisma.project.findFirst({
  where: { id, status: 'published' }, include: { category: true, tags: true },
}))

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const project = await getProject((await params).id)
  return { title: project?.title || '作品未找到', description: project?.summary }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, profile] = await Promise.all([getProject(id), prisma.profile.findUnique({ where: { id: 'default' } })])
  if (!project) notFound()
  return <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/projects" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 hover:text-ink"><ArrowLeft size={16} />返回作品库</Link>
      <div className="mb-8 max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink-3"><span className="rounded-full bg-subtle px-3 py-1">{project.category.name}</span>{project.completedAt && <span className="inline-flex items-center gap-1"><Calendar size={14} />{project.completedAt}</span>}</div>
        <h1 className="break-words text-3xl font-semibold leading-tight text-ink sm:text-4xl">{project.title}</h1>
        <p className="mt-4 whitespace-pre-wrap break-words text-base leading-8 text-ink-2">{project.summary}</p>
      </div>
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <ProjectGallery images={projectGallery(project.cover, project.images)} title={project.title} />
          <section className="rounded-card border border-line bg-surface p-5 sm:p-7">
            <h2 className="mb-4 text-xl font-semibold text-ink">作品详情</h2>
            <div className="whitespace-pre-wrap break-words text-sm leading-8 text-ink-2">{project.description || project.summary}</div>
          </section>
        </div>
        <aside className="min-w-0 space-y-6">
          <div className="space-y-3 rounded-card border border-line bg-surface p-5">
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-4 py-3 text-sm font-medium text-brand-ink">在线体验<ExternalLink size={16} /></a>
            {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-btn border border-line px-4 py-3 text-sm text-ink-2"><GitBranch size={16} />查看源码</a>}
          </div>
          {!!project.tags.length && <section className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink">技术与能力标签</h2>
            <div className="flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag.id} className="max-w-full break-words rounded-chip bg-subtle px-3 py-1.5 text-xs text-ink-2">{tag.name}</span>)}</div>
          </section>}
        </aside>
      </div>
    </main>
    <Footer profile={profile || { name: 'Web 独立创作者' }} />
  </div>
}
